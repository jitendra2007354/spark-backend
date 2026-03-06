"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rating_controller_1 = require("../controllers/rating.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Route to submit a new rating for a ride
// POST /api/ratings
router.post('/', auth_middleware_1.protect, rating_controller_1.createRatingController);
// Route to get all ratings for a user (driver)
// GET /api/ratings/:userId
router.get('/:userId', auth_middleware_1.protect, rating_controller_1.getRatingsController);
exports.default = router;
