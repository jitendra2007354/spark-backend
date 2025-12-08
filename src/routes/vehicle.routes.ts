import { Router } from 'express';
import { 
    addVehicle, 
    getVehicles, 
    setDefaultVehicle, 
    deleteVehicle 
} from '../controllers/vehicle.controller';
// This was the source of a build error. The correct function name is 'protect'.
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes in this file should be protected to ensure they are accessed by an authenticated user.
router.use(protect);

// Route to add a new vehicle for a driver
// POST /api/vehicles
router.post('/', addVehicle);

// Route to get all vehicles for the logged-in driver
// GET /api/vehicles
router.get('/', getVehicles);

// Route to set a specific vehicle as the default
// PATCH /api/vehicles/:vehicleId/default
router.patch('/:vehicleId/default', setDefaultVehicle);

// Route to delete a vehicle (soft delete)
// DELETE /api/vehicles/:vehicleId
router.delete('/:vehicleId', deleteVehicle);

export default router;
