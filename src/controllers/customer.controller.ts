import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getCustomerRideHistory } from '../services/ride.service';

export const getCustomerRides = async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.id;

  try {
    const rides = await getCustomerRideHistory(customerId);
    res.status(200).json(rides);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get ride history', message: error.message });
  }
};