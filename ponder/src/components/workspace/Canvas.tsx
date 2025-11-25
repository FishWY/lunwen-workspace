import React, { useCallback, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    addEdge,
    BackgroundVariant,
    type OnNodesChange,
    type OnEdgesChange,
} from '@xyflow/react';
import type { Connection, Edge, Node }
    from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLayoutedElements } from '../../utils/layout';
import { Copy, Link as LinkIcon, Sparkles, MoreHorizontal, Trash2, X, Key, Wand2, Download, FileText } from 'lucide-react';

import FileNode from './nodes/FileNode';
import SummaryNode from './nodes/SummaryNode';
import GenerationNode from './nodes/GenerationNode';
import NoteNode from './nodes/NoteNode';
import ReferenceNode from './nodes/ReferenceNode';
import TopicNode from './nodes/TopicNode';
import { extractTextFromPdf } from '../../utils/pdf';
import { generateSummary } from '../../services/ai';

const nodeTypes = {
    file: FileNode,
    summary: SummaryNode,
    generation: GenerationNode,
    note: NoteNode,
    reference: ReferenceNode,
    topic: TopicNode,
};

interface CanvasProps {
    fileUrl?: string;
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange<Node>;
    onEdgesChange: OnEdgesChange<Edge>;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    selectedNode: string | null;
    onNodeSelect: (nodeId: string | null) => void;
}

const Canvas = ({
    fileUrl,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    selectedNode,
    onNodeSelect
}: CanvasProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onLayout = useCallback((direction: string) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            direction
        );

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [nodes, edges, setNodes, setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        onNodeSelect(node.id);
        setMenuOpen(false); // Close menu when selecting a new node
    }, [onNodeSelect]);

    const lastClickTime = React.useRef(0);

    const onPaneClick = useCallback((event: React.MouseEvent) => {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastClickTime.current;

        if (timeDiff < 300) {
            // Double click detected
            const target = event.currentTarget as HTMLDivElement;
            const bounds = target.getBoundingClientRect();
            const position = {
                x: event.clientX - bounds.left - 100,
                y: event.clientY - bounds.top - 75,
            };

            const newNode: Node = {
                id: `note-${Date.now()}`,
                type: 'note',
                position,
                data: { label: 'New Note' },
            };

            setNodes((nds) => [...nds, newNode]);
        } else {
            // Single click
            onNodeSelect(null);
            setMenuOpen(false);
        }
        lastClickTime.current = currentTime;
    }, [setNodes, onNodeSelect]);

    // Logic: Delete Node
    const onDeleteNode = useCallback(() => {
        if (!selectedNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode && e.target !== selectedNode));
        onNodeSelect(null);
        setMenuOpen(false);
    }, [selectedNode, setNodes, setEdges, onNodeSelect]);

    // Logic: Delete Branch (Recursive)
    const onDeleteBranch = useCallback(() => {
        if (!selectedNode) return;

        const nodesToDelete = new Set<string>();
        const queue = [selectedNode];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            nodesToDelete.add(currentId);

            // Find children
            const children = edges
                .filter((e) => e.source === currentId)
                .map((e) => e.target);

            queue.push(...children);
        }

        setNodes((nds) => nds.filter((n) => !nodesToDelete.has(n.id)));
        setEdges((eds) => eds.filter((e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target)));
        onNodeSelect(null);
        setMenuOpen(false);
    }, [selectedNode, edges, setNodes, setEdges, onNodeSelect]);

    // Logic: Ask AI
    const onAskAI = useCallback(async () => {
        if (!selectedNode) return;
        if (!apiKey) {
            setShowKeyInput(true);
            return;
        }

        const sourceNode = nodes.find((n) => n.id === selectedNode);
        if (!sourceNode) return;

        const newNodeId = `gen-${Date.now()}`;
        const newX = sourceNode.position.x + 300;
        const newY = sourceNode.position.y;

        // 1. Create Generation Node
        const generationNode: Node = {
            id: newNodeId,
            type: 'generation',
            position: { x: newX, y: newY },
            data: {},
        };

        const newEdge: Edge = {
            id: `e${selectedNode}-${newNodeId}`,
            source: selectedNode,
            target: newNodeId,
            animated: true,
        };

        setNodes((nds) => [...nds, generationNode]);
        setEdges((eds) => [...eds, newEdge]);

        // 2. Extract Text and Call AI
        try {
            const text = fileUrl ? await extractTextFromPdf(fileUrl) : "No file loaded.";
            const summary = await generateSummary(text, apiKey);

            // Simulate Streaming: Update GenerationNode with content
            setNodes((nds) => nds.map((n) => {
                if (n.id === newNodeId) {
                    return {
                        ...n,
                        data: { content: summary, isStreaming: true },
                    };
                }
                return n;
            }));

            // Wait for "streaming" to finish (approx calculation based on length)
            const typingDuration = summary.length * 20 + 1000;

            setTimeout(() => {
                setNodes((nds) => nds.map((n) => {
                    if (n.id === newNodeId) {
                        return {
                            ...n,
                            type: 'summary',
                            data: { content: summary },
                        };
                    }
                    return n;
                }));
            }, typingDuration);

        } catch (error) {
            console.error(error);
            setNodes((nds) => nds.map((n) => {
                if (n.id === newNodeId) {
                    return {
                        ...n,
                        type: 'summary',
                        data: { content: "Error generating summary. Please check console." },
                    };
                }
                return n;
            }));
        }

    }, [selectedNode, nodes, setNodes, setEdges, apiKey, fileUrl]);

    // Logic: Copy
    const onCopy = useCallback(() => {
        if (!selectedNode) return;
        const node = nodes.find((n) => n.id === selectedNode);
        if (node) {
            const text = (node.data.content as string) || (node.data.label as string) || '';
            navigator.clipboard.writeText(text);
            // Optionally show toast
        }
    }, [selectedNode, nodes]);

    // Calculate toolbar position (mocked for simplicity, ideally relative to node)
    // In a real app, use React Flow's useReactFlow to get node position or a custom NodeToolbar
    const showToolbar = !!selectedNode;

    return (
        <div className="w-full h-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Controls />

                {/* Action Buttons */}
                <div className="absolute bottom-4 right-4 z-10 flex space-x-2">
                    {/* Export Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
                                if (reactFlowWrapper) {
                                    import('../../utils/export').then(({ exportCanvasAsPng }) => {
                                        exportCanvasAsPng(reactFlowWrapper);
                                    });
                                }
                            }}
                            className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 text-green-600 transition-all hover:scale-105 active:scale-95"
                            title="Export as PNG"
                        >
                            <Download size={20} />
                        </button>
                    </div>

                    {/* Copy Markdown */}
                    <button
                        onClick={() => {
                            import('../../utils/export').then(({ exportCanvasAsMarkdown }) => {
                                const markdown = exportCanvasAsMarkdown(nodes, edges);
                                navigator.clipboard.writeText(markdown);
                                // Optional: show toast notification
                            });
                        }}
                        className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 text-blue-600 transition-all hover:scale-105 active:scale-95"
                        title="Copy as Markdown"
                    >
                        <FileText size={20} />
                    </button>

                    {/* Magic Layout */}
                    <button
                        onClick={() => onLayout('LR')}
                        className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 text-purple-600 transition-all hover:scale-105 active:scale-95"
                        title="Magic Layout"
                    >
                        <Wand2 size={20} />
                    </button>
                </div>
            </ReactFlow>

            {/* API Key Input Modal */}
            {showKeyInput && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <Key className="mr-2" size={20} />
                            Enter Gemini API Key
                        </h3>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowKeyInput(false)}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowKeyInput(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toolbar (Mocked Position) */}
            {showToolbar && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <button onClick={onCopy} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 tooltip" title="Copy">
                        <Copy size={18} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Link">
                        <LinkIcon size={18} />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button onClick={onAskAI} className="flex items-center px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                        <Sparkles size={16} className="mr-2" />
                        <span className="text-sm font-medium">Ask AI</span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className={`p-2 hover:bg-gray-100 rounded-lg text-gray-600 ${menuOpen ? 'bg-gray-100' : ''}`}
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {/* Context Menu */}
                        {menuOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1">
                                <button onClick={onDeleteNode} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Node
                                </button>
                                <button onClick={onDeleteBranch} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                    <X size={16} className="mr-2" />
                                    Delete Branch
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(Canvas);
