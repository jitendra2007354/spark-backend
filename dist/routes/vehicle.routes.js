"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../controllers/vehicle.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All vehicle routes are for authenticated drivers
router.use(auth_middleware_1.protect);
// POST /api/vehicles - Add a new vehicle
router.post('/', vehicle_controller_1.addVehicle);
// GET /api/vehicles - Get all vehicles for the logged-in driver
router.get('/', vehicle_controller_1.getVehicles);
// PUT /api/vehicles/:vehicleId/default - Set a vehicle as default
router.put('/:vehicleId/default', vehicle_controller_1.setAsDefault);
// DELETE /api/vehicles/:vehicleId - Remove a vehicle
router.delete('/:vehicleId', vehicle_controller_1.removeVehicle);
exports.default = router;
