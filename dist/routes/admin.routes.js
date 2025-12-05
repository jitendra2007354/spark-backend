"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All admin routes require an authenticated admin user
router.use(auth_middleware_1.protect, auth_middleware_1.isAdmin);
// GET /api/admin/config - Get all system settings
router.get('/config', admin_controller_1.getSystemConfig);
// POST /api/admin/config - Update one or more system settings
router.post('/config', admin_controller_1.updateSystemConfig);
// GET /api/admin/users - Get all users
router.get('/users', admin_controller_1.getAllUsers);
// GET /api/admin/pricing - Get all pricing rules
router.get('/pricing', admin_controller_1.getPricing);
// GET /api/admin/tickets - Get all support tickets
router.get('/tickets', admin_controller_1.getTickets);
// GET /api/admin/drivers/locations - Get live driver locations
router.get('/drivers/locations', admin_controller_1.getDriverLocations);
// GET /api/admin/notifications/history - Get notification history
router.get('/notifications/history', admin_controller_1.getNotificationHistory);
exports.default = router;
