import { Router } from 'express';
import { createRide, getAvailableRides } from '../controllers/ride.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// POST /api/rides - Create a new ride request
router.post('/', protect, createRide);

// GET /api/rides/available - Get all pending ride requests for drivers
router.get('/available', protect, getAvailableRides);

export default router;
