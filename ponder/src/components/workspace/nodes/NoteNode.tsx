import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useState, useCallback } from 'react';

const NoteNode = ({ data, isConnectable }: NodeProps) => {
    const [text, setText] = useState((data.label as string) || 'Double-click to edit...');
    const [isEditing, setIsEditing] = useState(false);

    const onChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(evt.target.value);
        // In a real app, you'd update the node data in the React Flow state here
        data.label = evt.target.value;
    }, [data]);

    return (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl shadow-sm min-w-[200px] min-h-[150px] flex flex-col relative group transition-all hover:shadow-md">
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-yellow-400" />

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs font-bold text-yellow-600 mb-2 uppercase tracking-wide">Note</div>
                {isEditing ? (
                    <textarea
                        className="w-full h-full bg-transparent resize-none outline-none text-gray-800 text-sm font-medium"
                        value={text}
                        onChange={onChange}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                    />
                ) : (
                    <div
                        className="w-full h-full text-gray-800 text-sm font-medium whitespace-pre-wrap cursor-text"
                        onDoubleClick={() => setIsEditing(true)}
                    >
                        {text}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-yellow-400" />
        </div>
    );
};

export default NoteNode;
