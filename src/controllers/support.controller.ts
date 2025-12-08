
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { openTicket } from '../services/support.service';

export const submitSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const ticket = await openTicket(userId, subject, message);
    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
    }
  }
};
