import { Router } from 'express';
import { createRide, getAvailableRides, confirmRide, updateRideStatus } from '../controllers/ride.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All ride routes are protected
router.use(protect);

// POST /api/rides - Create a new ride request
router.post('/', createRide);

// GET /api/rides/available - Get all pending ride requests for drivers
router.get('/available', getAvailableRides);

// POST /api/rides/:rideId/confirm - Confirm a ride after a bid is accepted
router.post('/:rideId/confirm', confirmRide);

// PATCH /api/rides/:rideId/status - Update the ride's status (for drivers)
router.patch('/:rideId/status', updateRideStatus);


export default router;
