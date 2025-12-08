"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const router = (0, express_1.Router)();
// Route to get all current driver locations
// GET /api/location/drivers
router.get('/drivers', location_controller_1.getDriversLocationController);
exports.default = router;
