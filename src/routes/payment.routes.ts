
import { Router } from 'express';
import { makePayment } from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All payment routes are for authenticated users (specifically drivers)
router.use(protect);

// POST /api/payments/make-payment - A driver submits a payment
router.post('/make-payment', makePayment);

export default router;
