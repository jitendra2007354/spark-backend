import { Router } from 'express';
import { createBidController, getBidsController, acceptBidController } from '../controllers/bidding.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Route to create a new bid for a ride
// POST /api/bids
router.post('/', protect, createBidController);

// Route to get all bids for a specific ride
// GET /api/bids/:rideId
router.get('/:rideId', protect, getBidsController);

// Route to accept a bid
// POST /api/bids/accept
router.post('/accept', protect, acceptBidController);

export default router;
