import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const GenerationNode = ({ data, isConnectable }: NodeProps) => {
    const [displayText, setDisplayText] = useState('');
    const fullText = (data.content as string) || '';
    const isStreaming = data.isStreaming as boolean;

    useEffect(() => {
        if (isStreaming && fullText) {
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex <= fullText.length) {
                    setDisplayText(fullText.slice(0, currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 20); // Speed of typing
            return () => clearInterval(interval);
        } else if (!isStreaming && fullText) {
            setDisplayText(fullText);
        }
    }, [isStreaming, fullText]);

    return (
        <div className="bg-white border-2 border-purple-200 rounded-xl shadow-lg w-[300px] p-4 relative overflow-hidden">
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-purple-400" />

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 animate-gradient-x" />

            <div className="flex items-center space-x-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                    <Sparkles size={20} className="text-purple-600 animate-pulse" />
                </div>
                <span className="text-sm font-semibold text-purple-900">AI is thinking...</span>
            </div>

            <div className="space-y-2">
                {displayText ? (
                    <div className="text-sm text-gray-600 leading-relaxed font-medium min-h-[60px] prose prose-sm prose-purple max-w-none">
                        <ReactMarkdown>
                            {displayText}
                        </ReactMarkdown>
                        {isStreaming && <span className="inline-block w-1.5 h-4 bg-purple-500 ml-1 animate-blink" />}
                    </div>
                ) : (
                    <div className="flex flex-col space-y-2">
                        <div className="h-2 bg-gray-100 rounded w-3/4 animate-pulse" />
                        <div className="h-2 bg-gray-100 rounded w-full animate-pulse" />
                        <div className="h-2 bg-gray-100 rounded w-5/6 animate-pulse" />
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-purple-400" />
        </div>
    );
};

export default GenerationNode;
