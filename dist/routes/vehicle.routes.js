"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../controllers/vehicle.controller");
// This was the source of a build error. The correct function name is 'protect'.
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes in this file should be protected to ensure they are accessed by an authenticated user.
router.use(auth_middleware_1.protect);
// Route to add a new vehicle for a driver
// POST /api/vehicles
router.post('/', vehicle_controller_1.addVehicle);
// Route to get all vehicles for the logged-in driver
// GET /api/vehicles
router.get('/', vehicle_controller_1.getVehicles);
// Route to set a specific vehicle as the default
// PATCH /api/vehicles/:vehicleId/default
router.patch('/:vehicleId/default', vehicle_controller_1.setDefaultVehicle);
// Route to delete a vehicle (soft delete)
// DELETE /api/vehicles/:vehicleId
router.delete('/:vehicleId', vehicle_controller_1.deleteVehicle);
exports.default = router;
