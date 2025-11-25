import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import type { Message } from '../../types/session';

interface ChatSidebarProps {
    workspaceId?: string;
    chatHistory: Message[];
    onUpdateHistory: (messages: Message[]) => void;
    onClose: () => void;
}

const ChatSidebar = ({ workspaceId, chatHistory, onUpdateHistory, onClose }: ChatSidebarProps) => {
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || !workspaceId) return;
        if (isStreaming) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now(),
        };

        // Optimistically add user message
        const updatedHistory = [...chatHistory, userMessage];
        onUpdateHistory(updatedHistory);
        setInput('');

        // Add AI placeholder
        const aiMessageId = crypto.randomUUID();
        const aiPlaceholder: Message = {
            id: aiMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        };
        const historyWithPlaceholder = [...updatedHistory, aiPlaceholder];
        onUpdateHistory(historyWithPlaceholder);

        setIsStreaming(true);

        try {
            const { apiClient } = await import('../../services/api');
            let streamedContent = '';

            await apiClient.streamChat(
                workspaceId,
                updatedHistory.map(m => ({ role: m.role, content: m.content })),
                (chunk) => {
                    streamedContent += chunk;
                    // Update AI message in real-time
                    onUpdateHistory(
                        historyWithPlaceholder.map(m =>
                            m.id === aiMessageId
                                ? { ...m, content: streamedContent }
                                : m
                        )
                    );
                }
            );

        } catch (error) {
            console.error('Failed to get AI response:', error);
            toast.error('Failed to get response. Please try again.');
            // Remove placeholder on error
            onUpdateHistory(updatedHistory);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50">
                <h2 className="font-medium text-gray-900">Chat with Document</h2>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <X size={20} className="text-gray-600" />
                </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <p className="text-gray-500 mb-2">No messages yet</p>
                            <p className="text-sm text-gray-400">Ask a question about your document</p>
                        </div>
                    </div>
                )}

                {chatHistory.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            {message.role === 'user' ? (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            ) : (
                                <div className="text-sm prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-gray-900">
                                    {message.content ? (
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    ) : (
                                        <div className="flex items-center space-x-2 text-gray-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Thinking...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
                {!workspaceId && (
                    <div className="mb-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                        ⚠️ No workspace found. Please upload a PDF first.
                    </div>
                )}
                <div className="flex items-end space-x-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question..."
                        disabled={isStreaming || !workspaceId}
                        className="flex-1 resize-none outline-none border border-gray-200 rounded-xl px-4 py-2 text-sm max-h-32 disabled:bg-gray-50 disabled:text-gray-400 focus:border-blue-500 transition-colors"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isStreaming || !workspaceId}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isStreaming ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Press Enter to send, Shift + Enter for new line
                </p>
            </div>
        </div>
    );
};

export default ChatSidebar;
