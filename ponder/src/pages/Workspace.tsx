import { useParams } from 'react-router-dom';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import PdfViewer from '../components/workspace/PdfViewer';
import Canvas from '../components/workspace/Canvas';
import ChatSidebar from '../components/workspace/ChatSidebar';
import { useCallback, useEffect, useState } from 'react';
import { loadSession, saveSession } from '../utils/sessionDB';
import type { Session, Message } from '../types/session';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Download, Image as ImageIcon, FileText } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const Workspace = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [session, setSession] = useState<Session | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load session on mount
    useEffect(() => {
        const loadSessionData = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                const loadedSession = await loadSession(sessionId);
                if (loadedSession) {
                    setSession(loadedSession);
                    // Create object URL from Blob
                    const url = URL.createObjectURL(loadedSession.pdfBlob);
                    setPdfUrl(url);
                } else {
                    console.error('Session not found');
                }
            } catch (error) {
                console.error('Failed to load session:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSessionData();

        // Cleanup object URL
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [sessionId]);

    // Hydrate nodes with callbacks after loading
    useEffect(() => {
        if (!loading && session?.nodes) {
            const hydratedNodes = session.nodes.map((n) => {
                if (n.type === 'summary' || n.type === 'topic') {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            onDeepDive: (content: string) => onDeepDive(content, n.id),
                        },
                    };
                }
                return n;
            });
            setNodes(hydratedNodes);
            setEdges(session.edges);
        }
    }, [loading]); // Run once when loading finishes

    const initialNodes = session?.nodes || [
        {
            id: '1',
            type: 'file',
            position: { x: 250, y: 50 },
            data: { label: session?.title || 'Document' },
        },
    ];
    const initialEdges = session?.edges || [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [highlightData, setHighlightData] = useState<{ page: number; text: string } | null>(null);
    const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);

    // Chat state
    const [showChat, setShowChat] = useState(false);
    const [chatHistory, setChatHistory] = useState<Message[]>(session?.chatHistory || []);

    // Initialize chat history from session
    useEffect(() => {
        if (session?.chatHistory) {
            setChatHistory(session.chatHistory);
        }
    }, [session]);

    // Save to IndexedDB on change (Debounced)
    useEffect(() => {
        if (!session || !sessionId) return;

        const timeoutId = setTimeout(async () => {
            try {
                const updatedSession: Session = {
                    ...session,
                    nodes,
                    edges,
                    chatHistory, // Include chat history
                    lastModified: Date.now(),
                };
                await saveSession(updatedSession);
                setSession(updatedSession);
            } catch (error) {
                console.error('Failed to save session:', error);
            }
        }, 1000); // 1s debounce

        return () => clearTimeout(timeoutId);
    }, [nodes, edges, chatHistory, session, sessionId]);

    const onAddReference = useCallback((text: string, page: number) => {
        const newNodeId = `ref-${Date.now()}`;
        const newNode: Node = {
            id: newNodeId,
            type: 'reference',
            position: { x: 400, y: 200 }, // Default position, ideally calculated
            data: { label: text, page, quote: text },
        };

        setNodes((nds) => [...nds, newNode]);

        // Auto-Connect
        if (selectedNode) {
            const newEdge: Edge = {
                id: `e${selectedNode}-${newNodeId}`,
                source: selectedNode,
                target: newNodeId,
                animated: true,
            };
            setEdges((eds) => [...eds, newEdge]);
        } else if (nodes.length > 0) {
            // Connect to the first node if nothing selected (usually the file node)
            const rootNode = nodes[0];
            const newEdge: Edge = {
                id: `e${rootNode.id}-${newNodeId}`,
                source: rootNode.id,
                target: newNodeId,
                animated: true,
            };
            setEdges((eds) => [...eds, newEdge]);
        }
    }, [setNodes, setEdges, selectedNode, nodes]);

    const onNodeSelect = useCallback((nodeId: string | null) => {
        setSelectedNode(nodeId);
        if (nodeId) {
            const node = nodes.find((n) => n.id === nodeId);
            if (node && node.data.page) {
                setCurrentPage(node.data.page as number);
                // Set highlight data for PDF viewer
                if (node.data.quote) {
                    setHighlightData({
                        page: node.data.page as number,
                        text: node.data.quote as string,
                    });
                } else {
                    setHighlightData(null);
                }
            }
        } else {
            setHighlightData(null);
        }
    }, [nodes]);

    // Deep Dive Handler
    const onDeepDive = useCallback(async (nodeContent: string, sourceNodeId: string) => {
        // Check if we have a workspaceId
        if (!session?.workspaceId) {
            toast.error("No workspace found.");
            return;
        }

        try {
            const newNodeId = `gen-${Date.now()}`;
            const newX = 400; // Position to the right
            const newY = 200;

            // Create Generation Node with streaming
            const generationNode: Node = {
                id: newNodeId,
                type: 'generation',
                position: { x: newX, y: newY },
                data: { isStreaming: true },
            };

            const newEdge: Edge = {
                id: `e${sourceNodeId}-${newNodeId}`,
                source: sourceNodeId,
                target: newNodeId,
                animated: true,
            };

            setNodes((nds) => [...nds, generationNode]);
            setEdges((eds) => [...eds, newEdge]);

            // Call backend streaming API
            const { apiClient } = await import('../services/api');
            let streamedContent = '';

            await apiClient.streamChat(
                session.workspaceId,
                [
                    {
                        role: 'user',
                        content: `You are an expert analyst. Elaborate on this concept in detail: ${nodeContent}`
                    }
                ],
                (chunk) => {
                    // Update with each chunk for typewriter effect
                    streamedContent += chunk;
                    setNodes((nds) => nds.map((n) => {
                        if (n.id === newNodeId) {
                            return {
                                ...n,
                                data: { content: streamedContent, isStreaming: true },
                            };
                        }
                        return n;
                    }));
                }
            );

            // Convert to Summary after streaming completes
            setTimeout(() => {
                setNodes((nds) => nds.map((n) => {
                    if (n.id === newNodeId) {
                        return {
                            ...n,
                            type: 'summary',
                            data: { content: streamedContent, onDeepDive: (c: string) => onDeepDive(c, newNodeId) },
                        };
                    }
                    return n;
                }));
            }, 500); // Small delay for visual effect

        } catch (error) {
            console.error("Failed to generate deep dive:", error);
            toast.error("Failed to generate analysis. Please try again.");
        }
    }, [session, setNodes, setEdges]);

    // Auto-Generate Mind Map
    const onPdfLoaded = useCallback(async () => {
        // Check if we have a workspaceId
        if (!session?.workspaceId) {
            console.log("No workspaceId found, skipping auto-generation.");
            return;
        }

        setIsGeneratingMindMap(true);
        try {
            // Show loading state
            console.log("Generating Mind Map from backend...");

            // Call backend API instead of client-side AI
            const { apiClient } = await import('../services/api');
            const mindMapData = await apiClient.generateMindMap(session.workspaceId);

            if (!mindMapData || !mindMapData.root) return;

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            // Ensure we have a root node (File Node)
            let rootId = nodes[0]?.id;
            if (!rootId) {
                rootId = '1';
                const rootNode: Node = {
                    id: rootId,
                    type: 'file',
                    position: { x: 250, y: 50 },
                    data: { label: session?.title || 'Document' },
                };
                newNodes.push(rootNode);
            }

            // Recursive function to build graph with source grounding
            const processNode = (data: any, parentId: string, parentPage: number = 1) => {
                const id = `topic-${crypto.randomUUID()}`;

                // Inherit page from parent if missing or 0
                const page = data.page || parentPage;

                const node: Node = {
                    id,
                    type: 'topic',
                    position: { x: 0, y: 0 },
                    data: {
                        label: data.label || data.root,
                        quote: data.quote || '',
                        page: page,
                        onDeepDive: (content: string) => onDeepDive(content, id),
                    },
                };
                newNodes.push(node);
                newEdges.push({
                    id: `e${parentId}-${id}`,
                    source: parentId,
                    target: id,
                    animated: true,
                });

                if (data.children && Array.isArray(data.children)) {
                    data.children.forEach((child: any) => processNode(child, id, page));
                }
            };

            // Start processing from root
            // The AI returns { root: "Title", children: [...] }
            // We treat the "root" as the first child of the File Node
            processNode(mindMapData, rootId);

            setNodes((nds) => [...nds, ...newNodes]);
            setEdges((eds) => [...eds, ...newEdges]);

            // Trigger Layout
            setTimeout(() => {
                import('../utils/layout').then(({ getLayoutedElements }) => {
                    setNodes((currentNodes) => {
                        const { nodes: layoutedNodes } = getLayoutedElements(currentNodes, [...edges, ...newEdges], 'LR');
                        return layoutedNodes;
                    });
                });
            }, 100);

            toast.success("Mind map generated!");

        } catch (error) {
            console.error("Failed to generate mind map:", error);
            toast.error("Failed to generate mind map. Please try again.");
        } finally {
            setIsGeneratingMindMap(false);
        }
    }, [session, nodes, edges, setNodes, setEdges]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading session...</p>
                </div>
            </div>
        );
    }

    if (!session || !pdfUrl) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Session not found</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Left Panel: PDF Viewer */}
            <PdfViewer
                file={pdfUrl}
                onAddReference={onAddReference}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPdfLoaded={onPdfLoaded}
                highlightData={highlightData}
            />

            {/* Right Panel: Infinite Canvas */}
            <div className="flex-1 bg-gray-50 relative h-full" id="canvas-root">
                {/* Chat Toggle Button */}
                <button
                    onClick={() => setShowChat(!showChat)}
                    className="absolute top-4 right-4 z-10 flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <MessageSquare size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Chat</span>
                </button>

                {/* Export Button */}
                <div className="absolute top-4 right-40 z-10">
                    <div className="relative group">
                        <button
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                            onClick={async () => {
                                const el = document.getElementById('canvas-root');
                                if (!el) return;
                                try {
                                    const dataUrl = await htmlToImage.toPng(el, { cacheBust: true });
                                    const link = document.createElement('a');
                                    link.download = `${session?.title || 'canvas'}.png`;
                                    link.href = dataUrl;
                                    link.click();
                                } catch (err) {
                                    toast.error('Failed to export image');
                                }
                            }}
                            title="Export"
                        >
                            <Download size={18} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Export</span>
                        </button>
                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg hidden group-hover:block">
                            <button
                                className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-gray-700"
                                onClick={async () => {
                                    const el = document.getElementById('canvas-root');
                                    if (!el) return;
                                    try {
                                        const dataUrl = await htmlToImage.toPng(el, { cacheBust: true });
                                        const link = document.createElement('a');
                                        link.download = `${session?.title || 'canvas'}.png`;
                                        link.href = dataUrl;
                                        link.click();
                                    } catch (err) {
                                        toast.error('Failed to export image');
                                    }
                                }}
                            >
                                <ImageIcon size={16} className="mr-2 text-gray-600" /> Save as Image
                            </button>
                            <button
                                className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-gray-700"
                                onClick={() => {
                                    try {
                                        const childMap = new Map<string, string[]>();
                                        edges.forEach((e) => {
                                            const arr = childMap.get(e.source) || [];
                                            arr.push(e.target);
                                            childMap.set(e.source, arr);
                                        });

                                        const nodeMap = new Map<string, Node>();
                                        nodes.forEach((n) => nodeMap.set(n.id, n));

                                        const rootId = nodes[0]?.id;
                                        const lines: string[] = [];
                                        const visit = (id: string, depth: number) => {
                                            const n = nodeMap.get(id);
                                            if (!n) return;
                                            let title = '';
                                            if (n.type === 'file') title = (n.data.label as string) || 'Document';
                                            else if (n.type === 'topic') title = (n.data.label as string) || '';
                                            else if (n.type === 'summary') title = ((n.data.content as string) || '').split(/\n/)[0];
                                            else if (n.type === 'reference') title = `Quote: "${n.data.label as string}" (Page ${n.data.page as number})`;
                                            else title = (n.data.label as string) || '';
                                            lines.push(`${'  '.repeat(depth)}- ${title}`);
                                            const children = childMap.get(id) || [];
                                            children.forEach((cid) => visit(cid, depth + 1));
                                        };
                                        if (rootId) visit(rootId, 0);
                                        const md = lines.join('\n');
                                        navigator.clipboard.writeText(md);
                                        toast.success('Markdown copied to clipboard');
                                    } catch (err) {
                                        toast.error('Failed to copy Markdown');
                                    }
                                }}
                            >
                                <FileText size={16} className="mr-2 text-gray-600" /> Copy Markdown
                            </button>
                        </div>
                    </div>
                </div>

                <Canvas
                    fileUrl={pdfUrl}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    selectedNode={selectedNode}
                    onNodeSelect={onNodeSelect}
                />

                {/* Mind Map Generation Loading Indicator */}
                {isGeneratingMindMap && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-700 font-medium text-lg">Analyzing document structure...</p>
                            <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Sidebar */}
            {showChat && (
                <ChatSidebar
                    workspaceId={session?.workspaceId}
                    chatHistory={chatHistory}
                    onUpdateHistory={setChatHistory}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
};

export default Workspace;
