import { Router } from 'express';
import {
  addVehicle,
  getVehicles,
  setAsDefault,
  removeVehicle,
} from '../controllers/vehicle.controller';
import {  protect  } from '../middleware/auth.middleware';

const router = Router();

// All vehicle routes are for authenticated drivers
router.use( protect );

// POST /api/vehicles - Add a new vehicle
router.post('/', addVehicle);

// GET /api/vehicles - Get all vehicles for the logged-in driver
router.get('/', getVehicles);

// PUT /api/vehicles/:vehicleId/default - Set a vehicle as default
router.put('/:vehicleId/default', setAsDefault);

// DELETE /api/vehicles/:vehicleId - Remove a vehicle
router.delete('/:vehicleId', removeVehicle);

export default router;
