
import { Request, Response } from 'express';
import { getAllOnlineDriverLocations } from '../services/location.service';

/**
 * Controller to handle the retrieval of all active driver locations.
 */
export const getDriversLocationController = async (req: Request, res: Response) => {
  try {
    const locations = await getAllOnlineDriverLocations();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve driver locations.', error });
  }
};
