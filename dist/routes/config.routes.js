"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_controller_1 = require("../controllers/config.controller");
const router = (0, express_1.Router)();
// Admin: Create or update a configuration
router.post('/', config_controller_1.updateConfig);
// Public: Get the applicable configuration for a given context
router.get('/', config_controller_1.getConfig);
exports.default = router;
