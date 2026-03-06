"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure multer for in-memory file storage
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Route for a driver to upload a document (profile pic, license, or RC)
// The `upload.single('document')` middleware parses the file from the 'document' field in the multipart/form-data
router.post('/upload', [auth_middleware_1.protect, upload.single('document')], document_controller_1.uploadDocumentController);
// Route for an admin to verify a driver's document
router.post('/verify', [auth_middleware_1.protect, auth_middleware_1.isAdmin], document_controller_1.verifyDocumentController);
exports.default = router;
