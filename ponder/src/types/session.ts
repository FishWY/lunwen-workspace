import type { Node, Edge } from '@xyflow/react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Session {
    id: string;          // UUID
    title: string;       // Filename or extracted title
    pdfBlob: Blob;       // The actual PDF file (stored in IndexedDB)
    workspaceId?: string; // Backend workspace ID (optional for backward compatibility)
    nodes: Node[];       // React Flow nodes
    edges: Edge[];       // React Flow edges
    chatHistory: Message[]; // Chat conversation history
    lastModified: number; // Timestamp
}

export interface SessionMetadata {
    id: string;
    title: string;
    lastModified: number;
}
