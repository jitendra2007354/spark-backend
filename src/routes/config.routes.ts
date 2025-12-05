import { Router } from 'express';
import { updateConfig, getConfig } from '../controllers/config.controller';

const router = Router();

// Admin: Create or update a configuration
router.post('/', updateConfig);

// Public: Get the applicable configuration for a given context
router.get('/', getConfig);

export default router;
