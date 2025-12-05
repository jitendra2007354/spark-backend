import Ride, { RideStatus } from '../models/ride.model';
import Rating from '../models/rating.model';
import { calculateNewDriverRating } from '../utils/rating.util';

export const submitRating = async (
  rideId: number, 
  raterId: number, // The user giving the rating
  ratedId: number, // The user being rated
  rating: number, 
  comment: string
) => {
  const ride = await Ride.findByPk(rideId);
  if (!ride) throw new Error('Ride not found');

  // Security check: Only the customer or driver from the ride can rate it
  if (ride.customerId !== raterId && ride.driverId !== raterId) {
    throw new Error('You are not authorized to rate this ride.');
  }

  if (ride.status !== 'completed' as RideStatus) throw new Error('You can only rate completed rides.');

  const newRating = await Rating.create({
    rideId,
    raterId,
    ratedId,
    rating,
    comment,
  });

  // TODO: Update the driver's or user's average rating
  // This would involve fetching all ratings for the user and recalculating

  return newRating;
};

export const getRatingsForUser = async (userId: number) => {
  const ratings = await Rating.findAll({ where: { ratedId: userId } });
  return ratings;
};
