import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getDriverRideHistory } from '../services/ride.service';
import * as DriverService from '../services/driver.service'; // Import all driver services

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
    const drivers = await DriverService.findNearbyDrivers(
      parseFloat(lat as string),
      parseFloat(lng as string),
      vehicleType as string
    );
    res.status(200).json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to find nearby drivers', message: error.message });
  }
};

// --- NEW: Admin actions for blocking/unblocking drivers ---

export const blockDriver = async (req: Request, res: Response) => {
  const { id } = req.params; // This is the userId from the route parameter
  try {
    await DriverService.blockDriver(parseInt(id, 10));
    res.status(200).json({ message: `User ${id} has been successfully blocked.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to block driver', message: error.message });
  }
};

export const unblockDriver = async (req: Request, res: Response) => {
  const { id } = req.params; // This is the userId from the route parameter
  try {
    await DriverService.unblockDriver(parseInt(id, 10));
    res.status(200).json({ message: `User ${id} has been successfully unblocked.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to unblock driver', message: error.message });
  }
};
