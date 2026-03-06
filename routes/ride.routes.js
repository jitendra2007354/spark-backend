"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ride_controller_1 = require("../controllers/ride.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All ride routes are protected
router.use(auth_middleware_1.protect);
// POST /api/rides - Create a new ride request (Customer)
router.post('/', ride_controller_1.createRide);
// GET /api/rides/available - Get all pending ride requests (Driver)
router.get('/available', ride_controller_1.getAvailableRides);
// GET /api/rides/:id - Get ride details
router.get('/:id', ride_controller_1.getRideById);
// POST /api/rides/:id/accept - Accept a ride (Driver)
router.post('/:id/accept', ride_controller_1.acceptRide);
// POST /api/rides/:id/reject - Reject a ride (Driver)
router.post('/:id/reject', ride_controller_1.rejectRide);
// POST /api/rides/:id/cancel - Cancel a ride (Customer/Driver)
router.post('/:id/cancel', ride_controller_1.cancelRide);
// POST /api/rides/:rideId/confirm - Confirm a ride after bid acceptance (Customer)
router.post('/:rideId/confirm', ride_controller_1.confirmRide);
// PATCH /api/rides/:rideId/status - Update ride status (Driver)
router.patch('/:rideId/status', ride_controller_1.updateRideStatus);
exports.default = router;
