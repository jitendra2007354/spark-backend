"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDocumentController = exports.uploadDocumentController = void 0;
const document_service_1 = require("../services/document.service");
/**
 * Controller to handle document uploads.
 * Assumes middleware (like multer) has processed the file and attached it to the request.
 */
const uploadDocumentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { documentType } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    if (!['driverPic', 'license', 'rc'].includes(documentType)) {
        return res.status(400).json({ message: 'Invalid documentType.' });
    }
    try {
        const result = yield (0, document_service_1.uploadDocument)(userId, documentType, req.file.originalname);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to upload document.', error: error.message });
    }
});
exports.uploadDocumentController = uploadDocumentController;
/**
 * Controller for an admin to verify a document.
 */
const verifyDocumentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { driverId, documentType } = req.body;
    try {
        if (!driverId || !documentType) {
            return res.status(400).json({ message: 'driverId and documentType are required.' });
        }
        const result = yield (0, document_service_1.verifyDocument)(driverId, documentType);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to verify document.', error: error.message });
    }
});
exports.verifyDocumentController = verifyDocumentController;
