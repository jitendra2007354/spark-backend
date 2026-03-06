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
exports.toggleSystemNotificationLike = exports.markAllSystemNotificationsRead = exports.markSystemNotificationRead = exports.getSystemNotifications = void 0;
const notificationForSponsor_model_1 = __importDefault(require("../models/notificationForSponsor.model"));
// Helper to extract sponsor ID from the simple token (id:username base64)
const getSponsorIdFromToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return null;
    try {
        const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
        const id = parseInt(decoded.split(':')[0], 10);
        return isNaN(id) ? null : id;
    }
    catch (e) {
        return null;
    }
};
const getSystemNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sponsorId = getSponsorIdFromToken(req);
    if (!sponsorId)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const notifications = yield notificationForSponsor_model_1.default.findAll({
            where: { sponsorId },
            order: [['createdAt', 'DESC']]
        });
        // Map to frontend expected format if necessary (e.g. date field)
        const formatted = notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            date: n.createdAt,
            read: n.read,
            type: n.type,
            likes: n.likes,
            liked: n.liked,
            media: n.media
        }));
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
});
exports.getSystemNotifications = getSystemNotifications;
const markSystemNotificationRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sponsorId = getSponsorIdFromToken(req);
    if (!sponsorId)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const { id } = req.params;
        yield notificationForSponsor_model_1.default.update({ read: true }, { where: { id, sponsorId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error updating notification' });
    }
});
exports.markSystemNotificationRead = markSystemNotificationRead;
const markAllSystemNotificationsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sponsorId = getSponsorIdFromToken(req);
    if (!sponsorId)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        yield notificationForSponsor_model_1.default.update({ read: true }, { where: { sponsorId, read: false } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error updating notifications' });
    }
});
exports.markAllSystemNotificationsRead = markAllSystemNotificationsRead;
const toggleSystemNotificationLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sponsorId = getSponsorIdFromToken(req);
    if (!sponsorId)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const { id } = req.params;
        const { liked } = req.body;
        const notification = yield notificationForSponsor_model_1.default.findOne({ where: { id, sponsorId } });
        if (!notification)
            return res.status(404).json({ message: 'Notification not found' });
        const increment = liked ? 1 : -1;
        const newLikes = (notification.likes || 0) + increment;
        yield notification.update({
            liked: liked,
            likes: newLikes < 0 ? 0 : newLikes
        });
        res.json({ success: true, likes: newLikes });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error updating like' });
    }
});
exports.toggleSystemNotificationLike = toggleSystemNotificationLike;
