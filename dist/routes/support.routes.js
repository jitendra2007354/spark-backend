"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_controller_1 = require("../controllers/support.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All support routes are for authenticated users
router.use(auth_middleware_1.protect); // This is the corrected line that applies the middleware
// POST /api/support/tickets - Submit a new support ticket
router.post('/tickets', support_controller_1.submitSupportTicket);
exports.default = router;
