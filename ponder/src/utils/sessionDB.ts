import { get, set, del, keys } from 'idb-keyval';
import type { Session, SessionMetadata } from '../types/session';

const SESSION_PREFIX = 'session:';
const METADATA_KEY = 'sessions:metadata';

/**
 * Save a session to IndexedDB
 */
export const saveSession = async (session: Session): Promise<void> => {
    try {
        // Sanitize session data (remove functions from nodes/edges)
        const sanitizedSession = {
            ...session,
            nodes: session.nodes.map(node => {
                const { onDeepDive, ...restData } = node.data;
                return {
                    ...node,
                    data: restData
                };
            })
        };

        // Save the full session data
        await set(`${SESSION_PREFIX}${session.id}`, sanitizedSession);

        // Update metadata list
        const metadata = await getSessionsMetadata();
        const existingIndex = metadata.findIndex(m => m.id === session.id);

        const sessionMeta: SessionMetadata = {
            id: session.id,
            title: session.title,
            lastModified: session.lastModified,
        };

        if (existingIndex >= 0) {
            metadata[existingIndex] = sessionMeta;
        } else {
            metadata.push(sessionMeta);
        }

        // Sort by lastModified (most recent first)
        metadata.sort((a, b) => b.lastModified - a.lastModified);

        await set(METADATA_KEY, metadata);
    } catch (error) {
        console.error('Error saving session:', error);
        throw error;
    }
};

/**
 * Load a session from IndexedDB
 */
export const loadSession = async (sessionId: string): Promise<Session | null> => {
    try {
        const session = await get<Session>(`${SESSION_PREFIX}${sessionId}`);
        return session || null;
    } catch (error) {
        console.error('Error loading session:', error);
        return null;
    }
};

/**
 * Delete a session from IndexedDB
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
    try {
        await del(`${SESSION_PREFIX}${sessionId}`);

        // Update metadata
        const metadata = await getSessionsMetadata();
        const filtered = metadata.filter(m => m.id !== sessionId);
        await set(METADATA_KEY, filtered);
    } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
    }
};

/**
 * Get all sessions metadata (without full data)
 */
export const getSessionsMetadata = async (): Promise<SessionMetadata[]> => {
    try {
        const metadata = await get<SessionMetadata[]>(METADATA_KEY);
        return metadata || [];
    } catch (error) {
        console.error('Error getting sessions metadata:', error);
        return [];
    }
};

/**
 * Get all session IDs
 */
export const getAllSessionIds = async (): Promise<string[]> => {
    try {
        const allKeys = await keys();
        return allKeys
            .filter(key => typeof key === 'string' && key.startsWith(SESSION_PREFIX))
            .map(key => (key as string).replace(SESSION_PREFIX, ''));
    } catch (error) {
        console.error('Error getting all session IDs:', error);
        return [];
    }
};

/**
 * Create a new session
 */
export const createSession = async (
    title: string,
    pdfBlob: Blob,
    nodes: any[] = [],
    edges: any[] = [],
    workspaceId?: string
): Promise<Session> => {
    const session: Session = {
        id: crypto.randomUUID(),
        title,
        pdfBlob,
        workspaceId,
        nodes,
        edges,
        chatHistory: [], // Initialize empty chat history
        lastModified: Date.now(),
    };

    await saveSession(session);
    return session;
};
