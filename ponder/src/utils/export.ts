import { toPng } from 'html-to-image';
import type { Node, Edge } from '@xyflow/react';

export const exportCanvasAsPng = async (canvasElement: HTMLElement) => {
    try {
        const dataUrl = await toPng(canvasElement, {
            cacheBust: true,
            backgroundColor: '#f9fafb',
        });

        const link = document.createElement('a');
        link.download = `ponder-mindmap-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Failed to export canvas:', error);
        throw error;
    }
};

export const exportCanvasAsMarkdown = (nodes: Node[], edges: Edge[]): string => {
    // Find root node (usually the file node)
    const rootNode = nodes.find(n => n.type === 'file') || nodes[0];
    if (!rootNode) return '# Empty Canvas\n';

    const visited = new Set<string>();
    const lines: string[] = [];

    const traverse = (nodeId: string, depth: number) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const indent = '  '.repeat(depth);
        const label = (node.data.label || node.data.content || 'Untitled') as string;
        const cleanLabel = label.length > 100 ? label.substring(0, 100) + '...' : label;

        lines.push(`${indent}- ${cleanLabel}`);

        // Find children
        const children = edges
            .filter(e => e.source === nodeId)
            .map(e => e.target);

        children.forEach(child => traverse(child, depth + 1));
    };

    lines.push(`# ${rootNode.data.label || 'Mind Map'}\n`);
    traverse(rootNode.id, 0);

    return lines.join('\n');
};
