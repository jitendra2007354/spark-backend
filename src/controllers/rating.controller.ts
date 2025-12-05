import { Request, Response } from 'express';
import { submitRating, getRatingsForUser } from '../services/rating.service';
import Ride from '../models/ride.model';

/**
 * Controller to handle the submission of a new ride rating.
 */
export const createRatingController = async (req: Request, res: Response) => {
  const { rideId, rating, comment } = req.body;
  const raterId = (req as any).user.id; // Assuming auth middleware sets the user

  try {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    const ratedId = ride.customerId === raterId ? ride.driverId : ride.customerId;

    if (!ratedId) {
        return res.status(400).json({ message: 'Cannot determine the user to be rated.'});
    }

    const newRating = await submitRating(rideId, raterId, ratedId, rating, comment);
    res.status(201).json(newRating);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to submit rating.', error: error.message });
  }
};

/**
 * Controller to get all ratings for a specific user (driver).
 */
export const getRatingsController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const ratings = await getRatingsForUser(Number(userId));
    res.status(200).json(ratings);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve ratings.', error: error.message });
  }
};
