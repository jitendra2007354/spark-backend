"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// We will create this controller next
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
// Define the registration route
// POST /api/users/register
router.post('/register', user_controller_1.registerUser);
exports.default = router;
