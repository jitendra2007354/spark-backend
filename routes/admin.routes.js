"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All admin routes require an authenticated admin user
router.use(auth_middleware_1.protect, auth_middleware_1.isAdmin);
// --- AI ASSISTANT ---
router.post('/ai/generate', admin_controller_1.getAIAssistantResponse);
// GET /api/admin/config - Get all system settings
router.get('/config', admin_controller_1.getSystemConfig);
// POST /api/admin/config - Update one or more system settings
router.post('/config', admin_controller_1.updateSystemConfig);
// GET /api/admin/users - Get all users
router.get('/users', admin_controller_1.getAllUsers);
// POST /api/admin/users - Create a new user
router.post('/users', admin_controller_1.createUser);
// --- Pricing ---
// GET /api/admin/pricing - Get all pricing rules
router.get('/pricing', admin_controller_1.getPricing);
// POST /api/admin/pricing/:type - Add a new pricing rule of a specific type
router.post('/pricing/:type', admin_controller_1.addPricingRule);
// DELETE /api/admin/pricing/:type/:id - Delete a pricing rule of a specific type
router.delete('/pricing/:type/:id', admin_controller_1.deletePricingRule);
// GET /api/admin/tickets - Get all support tickets
router.get('/tickets', admin_controller_1.getTickets);
// GET /api/admin/drivers/locations - Get live driver locations
router.get('/drivers/locations', admin_controller_1.getDriverLocations);
// --- Notifications (Existing) ---
// GET /api/admin/notifications/history - Get notification history
router.get('/notifications/history', admin_controller_1.getNotificationHistory);
// POST /api/admin/notifications - Send a new notification (saves to DB)
router.post('/notifications', admin_controller_1.sendNotification);
// --- Real-time Notifications (New) ---
// POST /api/admin/notifications-v2 - Send a live notification via WebSocket
router.post('/notifications-v2', admin_controller_1.createRealtimeNotificationHandler);
exports.default = router;
