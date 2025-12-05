"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_1 = require("../controllers/driver.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// These routes are for authenticated users
router.get('/nearby', auth_middleware_1.protect, driver_controller_1.getNearbyDrivers);
// These routes are for authenticated drivers only
router.use(auth_middleware_1.protect, auth_middleware_1.isDriver);
// GET /api/driver/rides - Get the ride history for the currently logged-in driver
router.get('/rides', driver_controller_1.getDriverRides);
exports.default = router;
