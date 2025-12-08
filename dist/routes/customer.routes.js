"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All customer routes are for authenticated customers
router.use(auth_middleware_1.protect, auth_middleware_1.isCustomer);
// GET /api/customer/rides - Get the ride history for the currently logged-in customer
router.get('/rides', customer_controller_1.getCustomerRides);
exports.default = router;
