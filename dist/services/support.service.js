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
exports.createSupportTicket = void 0;
const supportTicket_model_1 = __importDefault(require("../models/supportTicket.model"));
/**
 * Creates a new support ticket.
 * @param userId - The ID of the user creating the ticket.
 * @param subject - The subject of the ticket.
 * @param message - The message body of the ticket.
 */
const createSupportTicket = (userId, subject, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ticket = yield supportTicket_model_1.default.create({
            userId,
            subject,
            message,
            status: 'Open',
        });
        return ticket;
    }
    catch (error) {
        console.error('Error creating support ticket:', error);
        throw new Error('Could not create the support ticket.');
    }
});
exports.createSupportTicket = createSupportTicket;
