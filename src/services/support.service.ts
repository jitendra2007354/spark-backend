import { Op } from 'sequelize';
import SupportTicket from '../models/support.model';

/**
 * Opens a new support ticket.
 * @param userId The ID of the user opening the ticket.
 * @param subject The subject of the ticket.
 * @param description The description of the issue.
 * @returns The newly created support ticket.
 */
export const openTicket = async (userId: number, subject: string, description: string) => {
    const ticket = await SupportTicket.create({
        userId,
        subject,
        description,
        status: 'OPEN',
    });
    return ticket;
};

/**
 * Closes a support ticket.
 * @param ticketId The ID of the ticket to close.
 * @returns The updated support ticket.
 */
export const closeTicket = async (ticketId: number) => {
    const ticket = await SupportTicket.findByPk(ticketId);
    if (!ticket) {
        throw new Error('Ticket not found');
    }
    ticket.status = 'CLOSED';
    await ticket.save();
    return ticket;
};

/**
 * Gets all tickets for a specific user.
 * @param userId The ID of the user.
 * @returns A list of support tickets.
 */
export const getTicketsByUser = async (userId: number) => {
    const tickets = await SupportTicket.findAll({ where: { userId } });
    return tickets;
};

/**
 * (Admin) Gets all open support tickets.
 * @returns A list of all open support tickets.
 */
export const getAllOpenTickets = async () => {
    const tickets = await SupportTicket.findAll({ where: { status: 'OPEN' } });
    return tickets;
};
