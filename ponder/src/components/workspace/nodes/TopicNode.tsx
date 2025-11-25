import { Handle, Position, type NodeProps, NodeToolbar } from '@xyflow/react';
import { Brain } from 'lucide-react';

const TopicNode = ({ data, isConnectable, selected }: NodeProps) => {
    const handleDeepDive = () => {
        if (data.onDeepDive && typeof data.onDeepDive === 'function') {
            (data.onDeepDive as (label: string) => void)(data.label as string);
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
            <div className="bg-white border border-gray-200 rounded-full shadow-sm px-4 py-2 min-w-[120px] text-center hover:shadow-md transition-all relative group">
                <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!bg-gray-400" />

                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-gray-700">
                        {data.label as string}
                    </span>
                    {typeof data.page === 'number' && (
                        <span className="text-[10px] text-gray-400 mt-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                            Page {data.page}
                        </span>
                    )}
                </div>

                <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!bg-gray-400" />
            </div>
        </>
    );
};

export default TopicNode;
