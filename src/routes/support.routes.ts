import { Router } from 'express';
import { submitSupportTicket } from '../controllers/support.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply the 'protect' middleware to all routes in this file
router.use(protect);

// POST /api/support/tickets - Submit a new support ticket
router.post('/tickets', submitSupportTicket);

export default router;
