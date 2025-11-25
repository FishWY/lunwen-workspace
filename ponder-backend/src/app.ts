import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import workspaceRoutes from './routes/workspace.routes';
import aiRoutes from './routes/ai.routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Simplified CORS - Allow all Vercel deployments
app.use(cors({
    origin: true, // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
app.use('/api', workspaceRoutes);
app.use('/api/ai', aiRoutes);

// Static client
const clientDir = path.resolve(__dirname, '../..', 'ponder', 'dist');
if (fs.existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(clientDir, 'index.html'));
    });
}

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});

// Start server only if not running in Vercel (serverless)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`🚀 Ponder Backend running on http://localhost:${port}`);
        console.log(`📝 Health check: http://localhost:${port}/health`);
    });
}

export default app;
