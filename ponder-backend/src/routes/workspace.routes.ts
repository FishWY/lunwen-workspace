import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadPdfHandler, getWorkspaceHandler, saveCanvasHandler } from '../controllers/workspace.controller';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});

router.post('/upload', upload.single('file'), uploadPdfHandler);
router.get('/workspace/:id', getWorkspaceHandler);
router.put('/workspace/:id/canvas', saveCanvasHandler);

export default router;
