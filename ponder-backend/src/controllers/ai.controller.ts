import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateMindMap, generateDeepDive, streamChatResponse } from '../services/ai.service';
import { limitTextSize } from '../services/pdf.service';
import fs from 'fs';

const prisma = new PrismaClient();

/**
 * POST /api/ai/mindmap
 * Generate mind map from workspace PDF content
 */
export async function generateMindMapHandler(req: Request, res: Response) {
    try {
        const { workspaceId } = req.body;

        if (!workspaceId) {
            return res.status(400).json({ error: 'workspaceId is required' });
        }

        // Fetch workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        // Ensure we have PDF text; fallback to re-extraction if missing
        // FORCE RE-EXTRACTION to ensure we use the new parser logic and get full content
        // This fixes the issue where old workspaces have truncated/stale text
        let pdfText = workspace.pdfContent;
        if (workspace.pdfUrl && fs.existsSync(workspace.pdfUrl)) {
            try {
                console.log('Forcing PDF re-extraction for workspace:', workspaceId);
                const { extractPdfText } = await import('../services/pdf.service');
                const extracted = await extractPdfText(workspace.pdfUrl);
                pdfText = extracted.text;

                // Update DB with fresh text
                await prisma.workspace.update({
                    where: { id: workspaceId },
                    data: { pdfContent: pdfText },
                });
                console.log('PDF re-extracted successfully. Length:', pdfText.length);
            } catch (reExtractErr) {
                console.warn('Re-extraction failed, proceeding with existing text:', reExtractErr);
            }
        }

        // Limit text size to save tokens (increased to ~300k chars for full papers)
        const limitedText = limitTextSize(pdfText, 300000);

        console.log('=== MIND MAP GENERATION DEBUG ===');
        console.log('PDF text length:', pdfText?.length || 0);
        console.log('Limited text length:', limitedText?.length || 0);
        console.log('First 500 chars of limited text:', limitedText?.substring(0, 500));
        console.log('================================');

        // Generate mind map
        const mindMap = await generateMindMap(limitedText);
        res.json(mindMap);
    } catch (error) {
        console.error('Error in generateMindMapHandler:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack:', error.stack);
        }
        try {
            const text = typeof req.body?.workspaceId === 'string'
                ? (await prisma.workspace.findUnique({ where: { id: req.body.workspaceId } }))?.pdfContent || ''
                : '';

            const pages: Array<{ page: number; text: string }> = [];
            const regex = /\[Page\s+(\d+)\]\n([\s\S]*?)(?=\[Page\s+\d+\]|$)/g;
            let m: RegExpExecArray | null;
            while ((m = regex.exec(text))) {
                pages.push({ page: Number(m[1]), text: m[2].trim() });
            }
            const children = pages.slice(0, 4).map(p => {
                const firstSentence = (p.text.match(/^[^。.!?\n]+[。.!?]?/)?.[0] || p.text.slice(0, 120)).trim();
                return {
                    label: `Page ${p.page}`,
                    quote: firstSentence,
                    page: p.page,
                    children: [],
                };
            });
            const fallback = {
                root: 'Document Overview',
                children: children.length ? children : [{ label: 'No extractable text', quote: '', page: 1, children: [] }],
            };
            res.json(fallback);
        } catch (fallbackErr) {
            res.status(500).json({
                error: 'Failed to generate mind map',
                details: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}

/**
 * POST /api/ai/deepdive
 * Generate deep dive explanation for a concept
 */
export async function deepDiveHandler(req: Request, res: Response) {
    try {
        const { workspaceId, concept } = req.body;

        if (!workspaceId || !concept) {
            return res.status(400).json({ error: 'workspaceId and concept are required' });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const explanation = await generateDeepDive(concept, workspace.pdfContent);

        res.json({
            success: true,
            data: { explanation },
        });
    } catch (error) {
        console.error('Error in deepDiveHandler:', error);
        res.status(500).json({
            error: 'Failed to generate deep dive',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * POST /api/ai/chat
 * Stream chat response
 */
export async function chatHandler(req: Request, res: Response) {
    try {
        const { workspaceId, messages } = req.body;

        if (!workspaceId || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'workspaceId and messages are required' });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Stream response
        const stream = streamChatResponse(messages, workspace.pdfContent);

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Error in chatHandler:', error);
        res.status(500).json({
            error: 'Failed to stream chat',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * GET /api/ai/models
 * Inspect available model names for the current API key
 */
