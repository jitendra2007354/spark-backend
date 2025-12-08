"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ride_controller_1 = require("../controllers/ride.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All ride routes are protected
router.use(auth_middleware_1.protect);
// POST /api/rides - Create a new ride request
router.post('/', ride_controller_1.createRide);
// GET /api/rides/available - Get all pending ride requests for drivers
router.get('/available', ride_controller_1.getAvailableRides);
// POST /api/rides/:rideId/confirm - Confirm a ride after a bid is accepted
router.post('/:rideId/confirm', ride_controller_1.confirmRide);
// PATCH /api/rides/:rideId/status - Update the ride's status (for drivers)
router.patch('/:rideId/status', ride_controller_1.updateRideStatus);
exports.default = router;
