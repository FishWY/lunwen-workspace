import { Router } from 'express';
import { generateMindMapHandler, deepDiveHandler, chatHandler } from '../controllers/ai.controller';

const router = Router();

router.post('/mindmap', generateMindMapHandler);
router.post('/deepdive', deepDiveHandler);
router.post('/chat', chatHandler);

export default router;
