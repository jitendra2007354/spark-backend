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
exports.getGamToken = exports.uploadCampaignBanner = exports.deleteNotification = exports.sendNotification = exports.getHistory = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const sponsor_model_1 = __importDefault(require("../models/sponsor.model"));
const sponsorNotification_model_1 = __importDefault(require("../models/sponsorNotification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const socket_service_1 = require("../services/socket.service");
const upload_service_1 = __importDefault(require("../services/upload.service"));
const sponsor_auth_service_1 = require("../services/sponsor-auth.service");
// This is a placeholder. In a real app, this would broadcast to all clients
// in the target rooms ('customers', 'drivers', 'all').
const broadcastNotification = (target, payload, sponsorNotificationId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Broadcasting to ${target}:`, payload);
    const userConditions = {};
    if (target === 'drivers') {
        userConditions.userType = 'Driver';
    }
    else if (target === 'customers') {
        userConditions.userType = 'Customer';
    }
    else { // 'all'
        userConditions.userType = ['Driver', 'Customer'];
    }
    const usersToNotify = yield user_model_1.default.findAll({ where: userConditions, attributes: ['id', 'userType'] });
    if (usersToNotify.length > 0) {
        const notificationsToCreate = usersToNotify.map(user => ({
            userId: user.id,
            title: payload.title,
            message: payload.message,
            type: 'offer', // Cast to any to satisfy NotificationType enum
            relatedData: {
                sponsorNotificationId: sponsorNotificationId,
                attachments: payload.attachments
            }
        }));
        yield notification_model_1.default.bulkCreate(notificationsToCreate);
    }
    if (target === 'all' || target === 'drivers') {
        (0, socket_service_1.sendMessageToRoom)('drivers', 'notification', payload);
    }
    if (target === 'all' || target === 'customers') {
        (0, socket_service_1.sendMessageToRoom)('customers', 'notification', payload);
    }
    const driverCount = usersToNotify.filter(u => u.userType === 'Driver').length;
    const customerCount = usersToNotify.filter(u => u.userType === 'Customer').length;
    return { driverCount, customerCount };
});
const JWT_SECRET = process.env.JWT_SPONSOR_SECRET || 'a_very_secure_secret_for_sponsors';
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const sponsor = yield sponsor_model_1.default.findOne({ where: { username, password } });
        if (!sponsor) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Create a secure JWT
        const token = jsonwebtoken_1.default.sign({ id: sponsor.id, username: sponsor.username, role: sponsor.role }, JWT_SECRET, { expiresIn: '1d' });
        // Use the service to build a consistent and safe user payload
        const userPayload = (0, sponsor_auth_service_1.buildSponsorPayload)(sponsor);
        // Add GAM and banner details to the payload for the frontend
        userPayload.advertiserId = sponsor.getDataValue('gamAdvertiserId');
        userPayload.orderId = sponsor.getDataValue('gamOrderId');
        userPayload.lineItemId = sponsor.getDataValue('gamLineItemId');
        userPayload.networkCode = sponsor.getDataValue('gamNetworkCode');
        userPayload.adUnitId = sponsor.getDataValue('gamAdUnitId');
        userPayload.bannerImage = sponsor.getDataValue('bannerImage');
        userPayload.serviceAccount = sponsor.getDataValue('serviceAccount');
        res.json({ token, user: userPayload, remainingLimit: userPayload.remainingLimit });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
exports.login = login;
const getHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sponsorId = req.sponsor.id;
        const history = yield sponsorNotification_model_1.default.findAll({
            where: { sponsorId },
            order: [['sentAt', 'DESC']]
        });
        res.json(history);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching history' });
    }
});
exports.getHistory = getHistory;
const sendNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sponsor = req.sponsor;
        const { title, message, target, scheduledFor } = req.body;
        const files = req.files;
        if (sponsor.remainingLimit <= 0) {
            return res.status(403).json({ message: 'Notification limit reached' });
        }
        if (sponsor.validUntil && new Date() > new Date(sponsor.validUntil)) {
            return res.status(403).json({ message: 'Plan expired. Please renew.' });
        }
        let finalMessage = message;
        // Enforce Custom HTML Template restriction: Strip tags if not allowed
        if (!sponsor.customHtmlTemplate) {
            finalMessage = message.replace(/<[^>]*>?/gm, '');
        }
        const attachments = files ? files.map(file => ({
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            url: `${process.env.BACKEND_URL || 'http://localhost:8000'}/public/uploads/sponsors/${file.filename}`
        })) : [];
        // Create the main sponsor notification record first
        const notification = yield sponsorNotification_model_1.default.create({
            sponsorId: sponsor.id,
            title,
            message: finalMessage,
            target,
            attachments,
            sentAt: scheduledFor ? new Date(scheduledFor) : new Date(),
            status: scheduledFor ? 'scheduled' : 'sending', // Mark as 'sending' initially
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            recipientCount: 0, // Will be updated
            driverCount: 0,
            customerCount: 0,
        });
        let counts = { driverCount: 0, customerCount: 0 };
        if (!scheduledFor) {
            // Now broadcast and create individual user notifications
            counts = yield broadcastNotification(target, { title, message: finalMessage, attachments }, notification.id);
            // Update the main notification with counts and final status
            notification.recipientCount = counts.driverCount + counts.customerCount;
            notification.driverCount = counts.driverCount;
            notification.customerCount = counts.customerCount;
            notification.status = 'sent';
            yield notification.save();
        }
        // Deduct limit
        sponsor.remainingLimit -= 1;
        yield sponsor.save();
        res.status(201).json({ notification, remainingLimit: sponsor.remainingLimit });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error sending notification' });
    }
});
exports.sendNotification = sendNotification;
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sponsorId = req.sponsor.id;
        const { id } = req.params;
        const notification = yield sponsorNotification_model_1.default.findOne({ where: { id, sponsorId } });
        if (!notification)
            return res.status(404).json({ message: 'Notification not found' });
        // If deleting a scheduled notification that hasn't been sent, refund the limit
        if (notification.status === 'scheduled') {
            req.sponsor.remainingLimit += 1;
            yield req.sponsor.save();
        }
        yield notification.destroy();
        res.json({ message: 'Notification deleted successfully', id });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error deleting notification' });
    }
});
exports.deleteNotification = deleteNotification;
// New endpoint for uploading campaign banner
const uploadCampaignBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sponsor = req.sponsor;
    // Use the upload service to handle the file upload
    upload_service_1.default.single('banner')(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.error('Banner upload error:', err);
            return res.status(500).json({ message: 'File upload failed', error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No banner file provided' });
        }
        try {
            const bannerUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/public/uploads/sponsors/${req.file.filename}`;
            sponsor.bannerImage = bannerUrl;
            yield sponsor.save();
            const updatedUserPayload = (0, sponsor_auth_service_1.buildSponsorPayload)(sponsor);
            // Ensure the payload is complete, matching the login response
            updatedUserPayload.advertiserId = sponsor.getDataValue('gamAdvertiserId');
            updatedUserPayload.orderId = sponsor.getDataValue('gamOrderId');
            updatedUserPayload.lineItemId = sponsor.getDataValue('gamLineItemId');
            updatedUserPayload.networkCode = sponsor.getDataValue('gamNetworkCode');
            updatedUserPayload.adUnitId = sponsor.getDataValue('gamAdUnitId');
            updatedUserPayload.bannerImage = bannerUrl;
            updatedUserPayload.serviceAccount = sponsor.getDataValue('serviceAccount');
            res.json({ message: 'Banner uploaded successfully', user: updatedUserPayload });
        }
        catch (error) {
            console.error('Server error during banner upload processing:', error);
            res.status(500).json({ message: 'Server error processing banner upload' });
        }
    }));
});
exports.uploadCampaignBanner = uploadCampaignBanner;
const getGamToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sponsor = req.sponsor;
        const serviceAccount = sponsor.serviceAccount;
        if (!sponsor.gamReportsEnabled) {
            return res.status(403).json({ message: 'GAM reports are not enabled for this account.' });
        }
        if (!serviceAccount || Object.keys(serviceAccount).length === 0) {
            return res.status(400).json({ message: 'Service Account is not configured for this sponsor.' });
        }
        const authClient = google_auth_library_1.auth.fromJSON(serviceAccount);
        authClient.scopes = ['https://www.googleapis.com/auth/dfp'];
        const token = yield authClient.getAccessToken();
        if (!token.token) {
            throw new Error('Failed to retrieve access token from Google.');
        }
        res.json({ token: token.token });
    }
    catch (error) {
        console.error('Error generating GAM token:', error);
        res.status(500).json({ message: 'Failed to generate GAM token', error: error.message });
    }
});
exports.getGamToken = getGamToken;
