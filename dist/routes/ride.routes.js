"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ride_controller_1 = require("../controllers/ride.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/rides - Create a new ride request
router.post('/', auth_middleware_1.protect, ride_controller_1.createRide);
// GET /api/rides/available - Get all pending ride requests for drivers
router.get('/available', auth_middleware_1.protect, ride_controller_1.getAvailableRides);
exports.default = router;
