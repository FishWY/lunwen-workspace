import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { extractPdfText } from '../services/pdf.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * POST /api/upload
 * Upload and process a PDF file
 */
export async function uploadPdfHandler(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title } = req.body;
        let userId = req.body.userId;
        // If no userId provided, use or create an anonymous user
        if (!userId) {
            const anonymousUser = await prisma.user.upsert({
                where: { email: 'anonymous@example.com' },
                update: {},
                create: {
                    email: 'anonymous@example.com',
                    passwordHash: 'placeholder',
                },
            });
            userId = anonymousUser.id;
        }

        // Extract text from PDF with page markers
        const filePath = req.file.path;
        let extractedData;
        try {
            extractedData = await extractPdfText(filePath);
        } catch (extractionError) {
            console.error('PDF extraction failed:', extractionError);
            extractedData = {
                fileName: path.basename(filePath),
                text: '',
            } as any;
        }

        // Create workspace in database
        const workspace = await prisma.workspace.create({
            data: {
                userId,
                title: title || extractedData.fileName,
                pdfUrl: filePath,
                pdfContent: extractedData.text,
            },
        });

        // Return format expected by frontend
        res.json({
            workspaceId: workspace.id,
            text: extractedData.text,
        });
    } catch (error) {
        console.error('Error in uploadPdfHandler:', error);

        // Clean up uploaded file on error
        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }

        res.status(500).json({
            error: 'Failed to process PDF',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * GET /api/workspace/:id
 * Get workspace details
 */
export async function getWorkspaceHandler(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const workspace = await prisma.workspace.findUnique({
            where: { id },
            include: {
                nodes: true,
                edges: true,
            },
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        res.json({
            success: true,
            data: workspace,
        });
    } catch (error) {
        console.error('Error in getWorkspaceHandler:', error);
        res.status(500).json({
            error: 'Failed to fetch workspace',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * PUT /api/workspace/:id/canvas
 * Save canvas state (nodes and edges)
 */
export async function saveCanvasHandler(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { nodes, edges } = req.body;

        // Delete existing nodes and edges
        await prisma.node.deleteMany({ where: { workspaceId: id } });
        await prisma.edge.deleteMany({ where: { workspaceId: id } });

        // Create new nodes and edges
        if (nodes && Array.isArray(nodes)) {
            await prisma.node.createMany({
                data: nodes.map((node: any) => ({
                    id: node.id,
                    workspaceId: id,
                    type: node.type,
                    position: JSON.stringify(node.position),
                    data: JSON.stringify(node.data),
                    parentId: node.parentId || null,
                })),
            });
        }

        if (edges && Array.isArray(edges)) {
            await prisma.edge.createMany({
                data: edges.map((edge: any) => ({
                    id: edge.id,
                    workspaceId: id,
                    source: edge.source,
                    target: edge.target,
                    animated: edge.animated || false,
                })),
            });
        }

        res.json({
            success: true,
            message: 'Canvas saved successfully',
        });
    } catch (error) {
        console.error('Error in saveCanvasHandler:', error);
        res.status(500).json({
            error: 'Failed to save canvas',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
