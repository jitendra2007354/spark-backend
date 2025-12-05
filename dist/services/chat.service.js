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
exports.getRideMessages = exports.sendMessage = exports.getChatHistory = exports.saveChatMessage = void 0;
const chat_model_1 = __importDefault(require("../models/chat.model"));
/**
 * Saves a new chat message to the database.
 * Can include either a text message or a file.
 */
const saveChatMessage = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = yield chat_model_1.default.create({
            rideId: data.rideId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            message: data.message || null,
            fileContent: data.fileContent || undefined,
            fileType: data.fileType || undefined,
        });
        return message;
    }
    catch (error) {
        console.error("Error saving chat message:", error);
        throw new Error("Could not save chat message.");
    }
});
exports.saveChatMessage = saveChatMessage;
/**
 * Retrieves the chat history for a specific ride.
 */
const getChatHistory = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield chat_model_1.default.findAll({ where: { rideId }, order: [['createdAt', 'ASC']] });
    }
    catch (error) {
        console.error(`Error fetching chat history for ride ${rideId}:`, error);
        return [];
    }
});
exports.getChatHistory = getChatHistory;
const sendMessage = (rideId, senderId, receiverId, message) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.saveChatMessage)({ rideId, senderId, receiverId, message });
});
exports.sendMessage = sendMessage;
const getRideMessages = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.getChatHistory)(rideId);
});
exports.getRideMessages = getRideMessages;
