
import { Router } from 'express';
import { getDriverRides, getNearbyDrivers } from '../controllers/driver.controller';
import { protect, isDriver } from '../middleware/auth.middleware';

const router = Router();

// These routes are for authenticated users
router.get('/nearby', protect, getNearbyDrivers);

// These routes are for authenticated drivers only
router.use(protect, isDriver);

// GET /api/driver/rides - Get the ride history for the currently logged-in driver
router.get('/rides', getDriverRides);

export default router;
