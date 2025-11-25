import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Quote } from 'lucide-react';

const ReferenceNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="bg-white border-l-4 border-blue-500 rounded-r-xl shadow-md max-w-[300px] min-w-[200px] group hover:shadow-lg transition-all">
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-blue-400" />

            <div className="p-4">
                <div className="flex items-start mb-2">
                    <Quote size={16} className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <div className="text-sm text-gray-700 italic font-serif leading-relaxed">
                        "{data.label as string}"
                    </div>
                </div>
                <div className="flex justify-end mt-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        Page {data.page as number}
                    </span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-blue-400" />
        </div>
    );
};

export default ReferenceNode;
