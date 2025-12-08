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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDocument = exports.uploadDocument = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
/**
 * Mocks uploading a document and returns a URL.
 * In a real application, this would handle file uploads to a cloud storage provider (e.g., S3).
 * @param userId The ID of the user uploading the document.
 * @param documentType The type of document being uploaded.
 * @param file The file to upload (in a real scenario).
 * @returns The public URL of the uploaded document.
 */
const uploadDocument = (userId, documentType, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findByPk(userId);
    if (!user || user.userType !== 'Driver') {
        throw new Error('Driver not found.');
    }
    // In a real implementation, you would upload the file to S3, Google Cloud Storage, etc.
    // and get a URL back. Here, we'll just construct a mock URL.
    const mockFileUrl = `https://your-storage-provider.com/documents/${userId}/${documentType}-${fileName}`;
    // Save the URL to the user's record
    switch (documentType) {
        case 'driverPic':
            user.driverPicUrl = mockFileUrl;
            break;
        case 'license':
            user.licenseUrl = mockFileUrl;
            break;
        case 'rc':
            user.rcUrl = mockFileUrl;
            break;
        default:
            throw new Error('Invalid document type.');
    }
    yield user.save();
    return { message: `${documentType} uploaded successfully.`, url: mockFileUrl };
});
exports.uploadDocument = uploadDocument;
/**
 * (Admin only) Verifies a document by marking its corresponding flag in the User model.
 * @param driverId The ID of the driver whose document is being verified.
 * @param documentType The type of document to verify.
 */
const verifyDocument = (driverId, documentType) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield user_model_1.default.findByPk(driverId);
    if (!driver || driver.userType !== 'Driver') {
        throw new Error('Driver not found.');
    }
    switch (documentType) {
        case 'driverPic':
            driver.driverPicIsVerified = true;
            break;
        case 'license':
            driver.licenseIsVerified = true;
            break;
        case 'rc':
            driver.rcIsVerified = true;
            break;
        default:
            throw new Error('Invalid document type for verification.');
    }
    yield driver.save();
    return { message: `Document '${documentType}' for driver ${driverId} has been successfully verified.` };
});
exports.verifyDocument = verifyDocument;
