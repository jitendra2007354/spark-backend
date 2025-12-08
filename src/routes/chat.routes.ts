import { Router, Request, Response } from 'express';
import {
  sendMessage,
  getRideMessages,
} from '../services/chat.service';
import { protect } from '../middleware/auth.middleware';
import Ride from '../models/ride.model'; // Corrected import path

const router = Router();

// POST /api/chat/send - Send a message
router.post('/send', protect, async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const { rideId, message } = req.body;

    if (!rideId || !message) {
      return res.status(400).json({ error: 'rideId and message are required.' });
    }

    // Determine the receiver
    const ride = await Ride.findByPk(rideId);
    if (!ride) {
        return res.status(404).json({ error: 'Ride not found.' });
    }

    // Ensure the sender is part of the ride
    if (senderId !== ride.customerId && senderId !== ride.driverId) {
        return res.status(403).json({ error: 'You are not part of this ride.' });
    }

    const receiverId = senderId === ride.customerId ? ride.driverId : ride.customerId;
    
    if (!receiverId) {
        return res.status(400).json({ error: 'Could not determine the recipient of the message.' });
    }

    const chatMessage = await sendMessage(rideId, senderId, receiverId, message);
    res.status(201).json(chatMessage);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send message.', message: error.message });
  }
});

// GET /api/chat/messages/:rideId - Get all messages for a ride
router.get('/messages/:rideId', protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { rideId } = req.params;

    // Optional: Verify user is part of the ride before allowing them to see messages
    const ride = await Ride.findByPk(rideId);
    if (!ride || (ride.customerId !== userId && ride.driverId !== userId)) {
      return res.status(403).json({ error: 'You are not authorized to view these messages.' });
    }

    const messages = await getRideMessages(Number(rideId));
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve messages.', message: error.message });
  }
});

export default router;
