import { getApplicableConfig } from './config.service';
import { VehicleType } from '../models/vehicle.model';

/**
 * Calculates the estimated fare for a ride based on distance, duration, and applicable configuration.
 */
export const calculateFare = async (
  distance: number, // in meters
  duration: number, // in seconds
  city?: string,
  vehicleType?: VehicleType
): Promise<{ fare: number; details: any }> => {
  const config = await getApplicableConfig(city, vehicleType);

  // Extract rates from the flexible config object, with fallbacks
  const baseFare = config.baseFare || 50;
  const perKilometerRate = config.perKmRate || 12;
  const perMinuteRate = config.perMinuteRate || 1;

  // Basic fare calculation
  const distanceInKm = distance / 1000;
  const durationInMin = duration / 60;
  const distanceFare = distanceInKm * perKilometerRate;
  const timeFare = durationInMin * perMinuteRate;
  let totalFare = baseFare + distanceFare + timeFare;

  // Apply surge pricing if applicable (example logic)
  const surgeMultiplier = config.surgeMultiplier || 1;
  totalFare *= surgeMultiplier;

  // Add taxes and fees
  const taxRate = config.taxRate || 0.05; // 5% tax
  const commissionRate = config.commissionRate || 0.15; // 15% commission
  const taxAmount = totalFare * taxRate;
  const commissionAmount = totalFare * commissionRate;
  const finalFare = totalFare + taxAmount;

  return {
    fare: Math.round(finalFare * 100) / 100, // Round to 2 decimal places
    details: {
      baseFare,
      distanceFare,
      timeFare,
      surgeMultiplier,
      subtotal: totalFare,
      taxAmount,
      commissionAmount,
    },
  };
};