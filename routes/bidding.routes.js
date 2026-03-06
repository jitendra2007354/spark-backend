"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bidding_controller_1 = require("../controllers/bidding.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Route to create a new bid for a ride
// POST /api/bids
router.post('/', auth_middleware_1.protect, bidding_controller_1.createBidController);
// Route to get all bids for a specific ride
// GET /api/bids/:rideId
router.get('/:rideId', auth_middleware_1.protect, bidding_controller_1.getBidsController);
// Route to accept a bid
// POST /api/bids/accept
router.post('/accept', auth_middleware_1.protect, bidding_controller_1.acceptBidController);
exports.default = router;
