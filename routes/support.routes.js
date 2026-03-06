"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_controller_1 = require("../controllers/support.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply the 'protect' middleware to all routes in this file
router.use(auth_middleware_1.protect);
// POST /api/support/tickets - Submit a new support ticket
router.post('/tickets', support_controller_1.submitSupportTicket);
exports.default = router;
