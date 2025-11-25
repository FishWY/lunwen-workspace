import axios, { type AxiosInstance } from 'axios';

/**
 * API Client for backend communication
 * Base URL: http://localhost:3001
 */
class ApiClient {
    private client: AxiosInstance;

    constructor() {
        const base = (typeof window !== 'undefined' && window.location?.origin) || 'http://localhost:3000';
        const envBase = (import.meta as any).env?.VITE_API_BASE_URL || base;
        this.client = axios.create({
            baseURL: envBase,
            timeout: 60000, // 60 seconds for AI operations
        });

        // Request interceptor for debugging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('[API] Request error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    console.error('[API] Response error:', error.response.status, error.response.data);
                } else if (error.request) {
                    console.error('[API] No response received:', error.request);
                } else {
                    console.error('[API] Error:', error.message);
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Upload PDF file to backend
     * @param file PDF file to upload
     * @returns { workspaceId, text } - workspace ID and extracted text
     */
    async uploadPDF(file: File): Promise<{ workspaceId: string; text: string }> {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await this.client.post('/api/upload', formData);
            return response.data;
        } catch (error) {
            console.error('Failed to upload PDF:', error);
            throw new Error('Failed to upload PDF. Please try again.');
        }
    }

    /**
     * Generate mind map from uploaded document
     * @param workspaceId Workspace ID from upload
     * @returns Mind map data structure
     */
    async generateMindMap(workspaceId: string): Promise<any> {
        try {
            const response = await this.client.post('/api/ai/mindmap', { workspaceId });
            return response.data;
        } catch (error) {
            console.error('Failed to generate mind map:', error);
            throw new Error('Failed to generate mind map. Please try again.');
        }
    }

    /**
     * Stream chat response from backend
     * @param workspaceId Workspace ID
     * @param messages Chat messages history
     * @param onChunk Callback for each text chunk
     */
    async streamChat(
        workspaceId: string,
        messages: Array<{ role: string; content: string }>,
        onChunk: (text: string) => void
    ): Promise<void> {
        try {
            const base = (typeof window !== 'undefined' && window.location?.origin) || 'http://localhost:3000';
            const envBase = (import.meta as any).env?.VITE_API_BASE_URL || base;
            const response = await fetch(`${envBase}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workspaceId, messages }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    onChunk(chunk);
                }
            }
        } catch (error) {
            console.error('Failed to stream chat:', error);
            throw new Error('Failed to stream chat response. Please try again.');
        }
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
