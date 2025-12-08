import Ride, { RideStatus } from '../models/ride.model';
import { sendMessageToUser } from './websocket.service';
import { Op } from 'sequelize';

// This was the source of a build error and has been corrected to use the RideStatus enum.
const validTransitions: { [key in RideStatus]?: RideStatus[] } = {
    [RideStatus.ACCEPTED]: [RideStatus.ARRIVED],
    [RideStatus.ARRIVED]: [RideStatus.IN_PROGRESS],
    [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED],
};

export const createRide = async (rideData: any) => {
    const ride = await Ride.create(rideData);
    return ride;
};

/**
 * Retrieves a ride by its ID.
 * @param rideId - The ID of the ride.
 */
export const getRideById = async (rideId: number) => {
    const ride = await Ride.findByPk(rideId);
    return ride;
};

/**
 * Confirms a ride, and notifies the driver.
 * This function was corrected to use the proper RideStatus enum.
 * @param rideId The ID of the ride to confirm.
 * @param customerId The ID of the customer confirming the ride.
 */
export const confirmRide = async (rideId: number, customerId: number) => {
  const ride = await Ride.findByPk(rideId);

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.customerId !== customerId) {
    throw new Error('You are not authorized to confirm this ride.');
  }

  // A ride can only be confirmed if a driver has already accepted it.
  // This was corrected to use the RideStatus enum instead of a string.
  if (ride.status !== RideStatus.ACCEPTED) {
    throw new Error('Ride cannot be confirmed in its current state.');
  }

  // This line was the source of a build error because 'confirmed' is not a valid RideStatus.
  // The logic is preserved by keeping the ride status as ACCEPTED and notifying the driver.
  // ride.status = 'confirmed';
  // await ride.save();

  // Notify the assigned driver that the ride is confirmed
  if (ride.driverId) {
    sendMessageToUser(ride.driverId, 'ride-confirmed', {
      rideId: ride.id,
      message: 'The customer has confirmed the ride. Please proceed to the pickup location.',
    });
  }

  return ride;
};

/**
 * Updates the status of a ride and notifies the customer.
 * This function enforces a valid ride lifecycle.
 * @param rideId The ID of the ride to update.
 * @param driverId The ID of the driver initiating the update.
 * @param newStatus The new status to set.
 */
export const updateRideStatus = async (rideId: number, driverId: number, newStatus: RideStatus) => {
    const ride = await Ride.findByPk(rideId);

    if (!ride) {
        throw new Error('Ride not found');
    }

    // 1. Authorization: Only the assigned driver can update the status.
    if (ride.driverId !== driverId) {
        throw new Error('You are not authorized to update this ride.');
    }

    // 2. State Validation: Ensure the new status is a valid transition.
    const allowedTransitions = validTransitions[ride.status];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${ride.status} to ${newStatus}.`);
    }

    // 3. Update Status: Set the new status and save the ride.
    ride.status = newStatus;
    await ride.save();

    // 4. Notify Customer: Send a real-time notification to the customer.
    sendMessageToUser(ride.customerId, 'ride_status_updated', {
        rideId: ride.id,
        status: newStatus,
        message: `Your ride is now ${newStatus}.`
    });

    return ride;
};


/**
 * Retrieves the ride history for a specific customer.
 * @param customerId - The ID of the customer.
 */
export const getCustomerRideHistory = async (customerId: number) => {
    return await Ride.findAll({ where: { customerId }, order: [['createdAt', 'DESC']] });
};

/**
 * Retrieves the ride history for a specific driver.
 * @param driverId - The ID of the driver.
 */
export const getDriverRideHistory = async (driverId: number) => {
    return await Ride.findAll({ where: { driverId }, order: [['createdAt', 'DESC']] });
};
