import { Request, Response } from 'express';
import {
  sendNotificationToUser,
  sendNotificationToUserGroup,
  sendNotificationToAll
} from '../services/notification.service';

export const sendToUser = async (req: Request, res: Response) => {
  try {
    const { userId, title, message } = req.body;
    await sendNotificationToUser(userId, title, message);
    res.status(200).json({ message: 'Notification sent successfully.' });
  } catch (error) {
    if (error instanceof Error) {
        res.status(400).json({ error: error.message });
    }
  }
};

export const sendToGroup = async (req: Request, res: Response) => {
  try {
    const { userType, title, message } = req.body;
    await sendNotificationToUserGroup(userType, title, message);
    res.status(200).json({ message: `Notification sent to all ${userType}s.` });
  } catch (error) {
    if (error instanceof Error) {
        res.status(400).json({ error: error.message });
    }
  }
};

export const sendToAllUsers = async (req: Request, res: Response) => {
    try {
      const { title, message } = req.body;
      await sendNotificationToAll(title, message);
      res.status(200).json({ message: 'Notification sent to all users.' });
    } catch (error) {
      if (error instanceof Error) {
          res.status(400).json({ error: error.message });
      }
    }
  };
  
