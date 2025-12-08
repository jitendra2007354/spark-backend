import { Request, Response } from 'express';
import { submitRating, getRatingsForUser } from '../services/rating.service';
import Ride from '../models/ride.model';

/**
 * Controller to handle the submission of a new ride rating.
 */
export const createRatingController = async (req: Request, res: Response) => {
  const { rideId, rating, comment } = req.body;
  // We assume the auth middleware provides the rater's ID
  const raterId = (req as any).user.id;

  try {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    // This was the source of a build error. We need to determine the type of user being rated.
    const isCustomerRatingDriver = ride.customerId === raterId;
    const ratedUserType = isCustomerRatingDriver ? 'driver' : 'customer';

    // The ratedId is determined by the service, so we don't need to calculate it here.

    const newRating = await submitRating(rideId, raterId, ratedUserType, rating, comment);
    res.status(201).json(newRating);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to submit rating.', error: error.message });
  }
};

/**
 * Controller to get all ratings for a specific user (can be a driver or a customer).
 */
export const getRatingsController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    // The service can fetch ratings for any user, abstracting the role.
    const ratings = await getRatingsForUser(Number(userId));
    res.status(200).json(ratings);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve ratings.', error: error.message });
  }
};
