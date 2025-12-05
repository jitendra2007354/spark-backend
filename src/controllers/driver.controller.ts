import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getDriverRideHistory } from '../services/ride.service';
import { findNearbyDrivers } from '../services/driver.service';

export const getDriverRides = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;

  try {
    const rides = await getDriverRideHistory(driverId);
    res.status(200).json(rides);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get ride history', message: error.message });
  }
};

export const getNearbyDrivers = async (req: Request, res: Response) => {
  const { lat, lng, vehicleType } = req.query;

  if (!lat || !lng || !vehicleType) {
    return res.status(400).json({ error: 'Missing required query parameters: lat, lng, vehicleType' });
  }

  try {
    const drivers = await findNearbyDrivers(
      parseFloat(lat as string),
      parseFloat(lng as string),
      vehicleType as string
    );
    res.status(200).json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to find nearby drivers', message: error.message });
  }
};