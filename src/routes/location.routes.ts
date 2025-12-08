import { Router } from 'express';
import { getDriversLocationController } from '../controllers/location.controller';

const router = Router();

// Route to get all current driver locations
// GET /api/location/drivers
router.get('/drivers', getDriversLocationController);

export default router;
