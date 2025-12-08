
import { Router } from 'express';
import { getDriverRides, getNearbyDrivers, blockDriver, unblockDriver } from '../controllers/driver.controller';
import { protect, isDriver, isAdmin } from '../middleware/auth.middleware'; // isAdmin middleware is assumed to exist

const router = Router();

// This route is for authenticated users (customers) to find drivers
router.get('/nearby', protect, getNearbyDrivers);

// --- Admin-only routes for managing specific drivers ---
// These routes are protected and require the user to be an administrator.
router.post('/:id/block', protect, isAdmin, blockDriver);
router.post('/:id/unblock', protect, isAdmin, unblockDriver);


// --- Driver-specific routes ---
// These routes are for the currently logged-in and authenticated driver.
router.use(protect, isDriver);

// GET /api/drivers/rides - Get the ride history for the currently logged-in driver
router.get('/rides', getDriverRides);

export default router;
