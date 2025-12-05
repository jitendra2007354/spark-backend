
import SupportTicket from '../models/supportTicket.model';

/**
 * Creates a new support ticket.
 * @param userId - The ID of the user creating the ticket.
 * @param subject - The subject of the ticket.
 * @param message - The message body of the ticket.
 */
export const createSupportTicket = async (
  userId: number,
  subject: string,
  message: string
) => {
  try {
    const ticket = await SupportTicket.create({
      userId,
      subject,
      message,
      status: 'Open',
    });
    return ticket;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw new Error('Could not create the support ticket.');
  }
};
