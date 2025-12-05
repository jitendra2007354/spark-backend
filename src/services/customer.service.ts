import { Op } from 'sequelize';
import User from '../models/user.model';
import sequelize from './database.service';

/**
 * Finds nearby available drivers for a customer.
 * This uses a simplified distance calculation.
 */
export const findNearbyDrivers = async (customerLat: number, customerLng: number, radiusInKm: number = 5) => {
  // A simplified bounding box calculation. For real-world applications, use PostGIS or a more accurate formula.
  const latConversion = 111.32; // km per degree latitude
  const lngConversion = latConversion * Math.cos(customerLat * (Math.PI / 180));

  const latDelta = radiusInKm / latConversion;
  const lngDelta = radiusInKm / lngConversion;

  const minLat = customerLat - latDelta;
  const maxLat = customerLat + latDelta;
  const minLng = customerLng - lngDelta;
  const maxLng = customerLng + lngDelta;

  const drivers = await User.findAll({
    where: {
      userType: 'Driver',
      isOnline: true,
      currentLat: {
        [Op.between]: [minLat, maxLat],
      },
      currentLng: {
        [Op.between]: [minLng, maxLng],
      },
    },
    // Exclude sensitive data from the result
    attributes: {
      exclude: ['otp', 'otpExpires', 'createdAt', 'updatedAt'],
    },
  });

  // For more accuracy, you could filter further by the Haversine distance here.
  return drivers;
};
