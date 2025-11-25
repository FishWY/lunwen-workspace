import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';

const FileNode = ({ data, selected }: NodeProps) => {
    return (
        <div className={`bg-white rounded-xl border-2 shadow-sm w-48 overflow-hidden transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
            <Handle type="target" position={Position.Top} className="!bg-gray-300" />

            <div className="h-32 bg-gray-100 flex items-center justify-center border-b border-gray-100">
                <FileText size={32} className="text-gray-400" />
            </div>
            <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">{data.label as string}</h3>
                <p className="text-xs text-gray-500 mt-1">PDF Document</p>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-300" />
        </div>
    );
};

export default memo(FileNode);
