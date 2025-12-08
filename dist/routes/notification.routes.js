"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// Admin: Send notification to a specific user
router.post('/user', notification_controller_1.sendToUser);
// Admin: Send notification to a group of users (customers or drivers)
router.post('/group', notification_controller_1.sendToGroup);
// Admin: Send notification to all users
router.post('/all', notification_controller_1.sendToAllUsers);
exports.default = router;
