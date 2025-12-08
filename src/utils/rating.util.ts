import Rating from '../models/rating.model';
import Driver from '../models/driver.model';

/**
 * Recalculates and updates a driver's average rating.
 * @param driverId The ID of the driver to update.
 */
export const calculateNewDriverRating = async (driverId: number) => {
  const ratings = await Rating.findAll({ where: { ratedId: driverId } });
  if (ratings.length === 0) {
    return; // No ratings yet, nothing to calculate
  }

  const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  const averageRating = totalRating / ratings.length;

  // This was the source of a build error. The field is 'averageRating', not 'rating'.
  await Driver.update({ averageRating: averageRating }, { where: { id: driverId } });
};
