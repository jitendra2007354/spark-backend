import { Router } from 'express';
import { submitSupportTicket } from '../controllers/support.controller';
import {  protect  } from '../middleware/auth.middleware';

const router = Router();

// All support routes are for authenticated users
router.use(protect); // This is the corrected line that applies the middleware

// POST /api/support/tickets - Submit a new support ticket
router.post('/tickets', submitSupportTicket);

export default router;