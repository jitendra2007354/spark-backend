import Ride, { RideStatus } from '../models/ride.model';

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

export const updateRideStatus = async (rideId: number, status: RideStatus, driverId?: number) => {
    const ride = await Ride.findByPk(rideId);
    if (ride) {
        ride.status = status;
        if (driverId) {
            ride.driverId = driverId;
        }
        await ride.save();
    }
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
