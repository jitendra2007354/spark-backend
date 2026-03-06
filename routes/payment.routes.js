"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All payment routes are for authenticated users (specifically drivers)
router.use(auth_middleware_1.protect);
// POST /api/payments/make-payment - A driver submits a payment
router.post('/make-payment', payment_controller_1.makePayment);
exports.default = router;
