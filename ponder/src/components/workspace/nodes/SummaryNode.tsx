import { Handle, Position, type NodeProps, NodeToolbar } from '@xyflow/react';
import { Sparkles, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SummaryNode = ({ data, isConnectable, selected }: NodeProps) => {
    const handleDeepDive = () => {
        if (data.onDeepDive && typeof data.onDeepDive === 'function') {
            (data.onDeepDive as (content: string) => void)(data.content as string);
        }
    };

    return (
        <>
            {selected && (
                <NodeToolbar>
                    <button
                        onClick={handleDeepDive}
                        className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-1 shadow-sm"
                    >
                        <Brain size={12} />
                        <span>Deep Dive</span>
                    </button>
                </NodeToolbar>
            )}
            <div className="bg-white border-2 border-purple-200 rounded-xl shadow-lg w-[300px] p-4 relative overflow-hidden group hover:shadow-xl transition-all">
                <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-purple-400" />

                <div className="flex items-center space-x-2 mb-3 border-b border-purple-50 pb-2">
                    <Sparkles size={16} className="text-purple-500" />
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">AI Summary</span>
                </div>

                <div className="text-sm text-gray-700 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar prose prose-sm prose-purple max-w-none">
                    <ReactMarkdown>
                        {data.content as string}
                    </ReactMarkdown>
                </div>

                <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-purple-400" />
            </div>
        </>
    );
};

export default SummaryNode;
