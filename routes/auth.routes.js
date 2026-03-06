"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_service_1 = __importDefault(require("../services/upload.service"));
const router = (0, express_1.Router)();
// Route to log in or register a user with Google OAuth data
router.post('/login', upload_service_1.default.any(), auth_controller_1.login);
// Route for guest login
router.post('/guest-login', auth_controller_1.guestLogin);
// Route for admin login
router.post('/admin-login', auth_controller_1.adminLogin);
// Route to get the current user
router.get('/me', auth_middleware_1.protect, auth_controller_1.me);
exports.default = router;
