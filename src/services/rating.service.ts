import Ride, { RideStatus } from '../models/ride.model';
import Rating from '../models/rating.model';
import User from '../models/user.model';
import Driver from '../models/driver.model';

// This function is exported correctly.
export const submitRating = async (
  rideId: number, 
  raterId: number, // The ID of the user giving the rating
  ratedUserType: 'customer' | 'driver', // Type of user being rated
  rating: number, 
  comment: string
) => {
  const ride = await Ride.findByPk(rideId);
  if (!ride) throw new Error('Ride not found');

  // Security check: Only the customer or driver from the ride can rate it.
  if (ride.customerId !== raterId && ride.driverId !== raterId) {
    throw new Error('You are not authorized to rate this ride.');
  }

  // Logic check: You can only rate completed rides. This was a source of a build error.
  if (ride.status !== RideStatus.COMPLETED) { // Use the correct enum value
    throw new Error('You can only rate completed rides.');
  }

  // Determine who is being rated
  const ratedId = ratedUserType === 'driver' ? ride.driverId : ride.customerId;
  if (!ratedId) {
    throw new Error(`Cannot submit rating. The ${ratedUserType} does not exist for this ride.`);
  }

  // Prevent duplicate ratings
  const existingRating = await Rating.findOne({ where: { rideId, raterId, ratedId } });
  if (existingRating) {
    throw new Error('You have already rated this user for this ride.');
  }

  const newRating = await Rating.create({
    rideId,
    raterId,
    ratedId,
    rating,
    comment,
  });

  // Update the average rating of the user who was rated
  const allRatings = await Rating.findAll({ where: { ratedId } });
  const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / allRatings.length;

  if (ratedUserType === 'driver') {
    await Driver.update({ averageRating: averageRating }, { where: { id: ratedId } });
  } else {
    await User.update({ averageRating: averageRating }, { where: { id: ratedId } });
  }

  return newRating;
};

// This function is also exported correctly.
export const getRatingsForUser = async (userId: number) => {
  const ratings = await Rating.findAll({ where: { ratedId: userId }, include: [{ model: User, as: 'rater', attributes: ['id', 'name', 'photoUrl'] }] });
  return ratings;
};
