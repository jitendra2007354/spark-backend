
import { Request, Response } from 'express';
import { sendAdminNotification } from '../services/notification.service';

/**
 * Controller to send a notification to a specific user.
 * Expects { userId: number, title: string, message: string } in the body.
 */
export const sendToUser = async (req: Request, res: Response) => {
  try {
    const { userId, title, message } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields: userId, title, message.' });
    }

    // The service expects an array of user IDs for individual targets.
    await sendAdminNotification([userId], { title, message });

    res.status(200).json({ message: 'Notification sent successfully.' });
  } catch (error) {
    console.error('Failed to send notification to user:', error);
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
    } else {
        res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
};

/**
 * Controller to send a notification to a group of users (drivers or customers).
 * Expects { userType: 'drivers' | 'customers', title: string, message: string } in the body.
 */
export const sendToGroup = async (req: Request, res: Response) => {
  try {
    const { userType, title, message } = req.body;

    if (!userType || !['drivers', 'customers'].includes(userType) || !title || !message) {
      return res.status(400).json({ error: 'Missing or invalid fields. Requires userType (\'drivers\' or \'customers\'), title, and message.' });
    }

    await sendAdminNotification(userType, { title, message });
    res.status(200).json({ message: `Notification sent to all ${userType}.` });
  } catch (error) {
    console.error(`Failed to send notification to group ${req.body.userType}:`, error);
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
    } else {
        res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
};

/**
 * Controller to send a notification to all users.
 * Expects { title: string, message: string } in the body.
 */
export const sendToAllUsers = async (req: Request, res: Response) => {
    try {
      const { title, message } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'Missing required fields: title, message.' });
      }

      await sendAdminNotification('all', { title, message });
      res.status(200).json({ message: 'Notification sent to all users.' });
    } catch (error) {
        console.error('Failed to send notification to all users:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred.' });
      }
    }
  };
