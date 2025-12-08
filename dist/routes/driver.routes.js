"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_1 = require("../controllers/driver.controller");
const auth_middleware_1 = require("../middleware/auth.middleware"); // isAdmin middleware is assumed to exist
const router = (0, express_1.Router)();
// This route is for authenticated users (customers) to find drivers
router.get('/nearby', auth_middleware_1.protect, driver_controller_1.getNearbyDrivers);
// --- Admin-only routes for managing specific drivers ---
// These routes are protected and require the user to be an administrator.
router.post('/:id/block', auth_middleware_1.protect, auth_middleware_1.isAdmin, driver_controller_1.blockDriver);
router.post('/:id/unblock', auth_middleware_1.protect, auth_middleware_1.isAdmin, driver_controller_1.unblockDriver);
// --- Driver-specific routes ---
// These routes are for the currently logged-in and authenticated driver.
router.use(auth_middleware_1.protect, auth_middleware_1.isDriver);
// GET /api/drivers/rides - Get the ride history for the currently logged-in driver
router.get('/rides', driver_controller_1.getDriverRides);
exports.default = router;
