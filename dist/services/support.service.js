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
exports.getAllOpenTickets = exports.getTicketsByUser = exports.closeTicket = exports.openTicket = void 0;
const support_model_1 = __importDefault(require("../models/support.model"));
/**
 * Opens a new support ticket.
 * @param userId The ID of the user opening the ticket.
 * @param subject The subject of the ticket.
 * @param description The description of the issue.
 * @returns The newly created support ticket.
 */
const openTicket = (userId, subject, description) => __awaiter(void 0, void 0, void 0, function* () {
    const ticket = yield support_model_1.default.create({
        userId,
        subject,
        description,
        status: 'OPEN',
    });
    return ticket;
});
exports.openTicket = openTicket;
/**
 * Closes a support ticket.
 * @param ticketId The ID of the ticket to close.
 * @returns The updated support ticket.
 */
const closeTicket = (ticketId) => __awaiter(void 0, void 0, void 0, function* () {
    const ticket = yield support_model_1.default.findByPk(ticketId);
    if (!ticket) {
        throw new Error('Ticket not found');
    }
    ticket.status = 'CLOSED';
    yield ticket.save();
    return ticket;
});
exports.closeTicket = closeTicket;
/**
 * Gets all tickets for a specific user.
 * @param userId The ID of the user.
 * @returns A list of support tickets.
 */
const getTicketsByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const tickets = yield support_model_1.default.findAll({ where: { userId } });
    return tickets;
});
exports.getTicketsByUser = getTicketsByUser;
/**
 * (Admin) Gets all open support tickets.
 * @returns A list of all open support tickets.
 */
const getAllOpenTickets = () => __awaiter(void 0, void 0, void 0, function* () {
    const tickets = yield support_model_1.default.findAll({ where: { status: 'OPEN' } });
    return tickets;
});
exports.getAllOpenTickets = getAllOpenTickets;
