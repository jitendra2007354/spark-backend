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
const driver_model_1 = __importDefault(require("../models/driver.model"));
/**
 * Mocks uploading a document and returns a URL.
 * In a real application, this would handle file uploads to a cloud storage provider (e.g., S3).
 * @param userId The ID of the user uploading the document.
 * @param documentType The type of document being uploaded.
 * @param file The file to upload (in a real scenario).
 * @returns The public URL of the uploaded document.
 */
const uploadDocument = (userId, documentType, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Find the User (needed for driverPic/pfp)
    const user = yield user_model_1.default.findByPk(userId);
    if (!user)
        throw new Error('User not found.');
    // 2. Find the Driver profile (needed for license/rc)
    const driver = yield driver_model_1.default.findOne({ where: { userId } });
    // In a real implementation, you would upload the file to S3, Google Cloud Storage, etc.
    // and get a URL back. Here, we'll just construct a mock URL.
    const mockFileUrl = `https://your-storage-provider.com/documents/${userId}/${documentType}-${fileName}`;
    // 3. Update the appropriate model based on document type
    switch (documentType) {
        case 'driverPic':
            // Update the User's profile picture
            user.pfp = mockFileUrl;
            yield user.save();
            break;
        case 'license':
            if (!driver)
                throw new Error('Driver profile not found for license upload.');
            driver.driverLicensePhotoUrl = mockFileUrl;
            yield driver.save();
            break;
        case 'rc':
            if (!driver)
                throw new Error('Driver profile not found for RC upload.');
            driver.rcPhotoUrl = mockFileUrl;
            yield driver.save();
            break;
        default:
            throw new Error('Invalid document type.');
    }
    return { message: `${documentType} uploaded successfully.`, url: mockFileUrl };
});
exports.uploadDocument = uploadDocument;
/**
 * (Admin only) Verifies a document by marking its corresponding flag.
 * Note: Verification flags are stored on the User model.
 * @param driverId The ID of the driver whose document is being verified.
 * @param documentType The type of document to verify.
 */
const verifyDocument = (driverId, documentType) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Find the Driver to get the userId
    const driverProfile = yield driver_model_1.default.findByPk(driverId);
    if (!driverProfile) {
        throw new Error('Driver profile not found.');
    }
    // 2. Find the User to update verification flags
    const user = yield user_model_1.default.findByPk(driverProfile.userId);
    if (!user) {
        throw new Error('Associated user account not found.');
    }
    switch (documentType) {
        case 'driverPic':
            // Assuming there might be a flag for this, or just implicit via pfp existence
            break;
        case 'license':
            user.licenseIsVerified = true;
            break;
        case 'rc':
            user.rcIsVerified = true;
            break;
        default:
            throw new Error('Invalid document type for verification.');
    }
    yield user.save();
    return { message: `Document '${documentType}' for driver ${driverId} has been successfully verified.` };
});
exports.verifyDocument = verifyDocument;
