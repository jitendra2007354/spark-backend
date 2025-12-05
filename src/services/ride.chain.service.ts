import { findNearestAvailableDriver } from './driver.service';
import { updateRideStatus } from './ride.service';
import Ride, { RideStatus } from '../models/ride.model';
import { getConfig } from './config.service';

// The core logic that moves a ride through its lifecycle
export const processRideChain = async (rideId: number) => {
    const ride = await Ride.findByPk(rideId);
    if (!ride || ride.status !== 'searching') return;

    const excludedDriverIds = ride.rejectedBy ? ride.rejectedBy.split(',').map((id: string) => parseInt(id, 10)) : [];

    // 1. Find the nearest available driver
    const nearestDriver = await findNearestAvailableDriver(ride.pickupLocation.latitude, ride.pickupLocation.longitude, ride.vehicleType, excludedDriverIds);

    if (nearestDriver) {
        console.log(`Ride ${rideId}: Found potential driver ${nearestDriver.id}. Notifying...`);
        // TODO: Notify driver (this would be a push notification in a real app)
        // We'll simulate the driver accepting for now
        setTimeout(() => handleDriverAccept(rideId, nearestDriver.id), 5000); // 5s accept timer
    } else {
        console.log(`Ride ${rideId}: No available drivers found.`);
        await updateRideStatus(rideId, 'no_drivers' as RideStatus);
    }
};

export const handleDriverAccept = async (rideId: number, driverId: number) => {
    const ride = await Ride.findByPk(rideId);
    // Ensure the ride is still searching
    if (!ride || ride.status !== 'searching') return;

    try {
        // Attempt to confirm the ride
        const success = await updateRideStatus(rideId, 'confirmed' as RideStatus, driverId);
        if (success) {
            console.log(`Ride ${rideId}: Confirmed by driver ${driverId}.`);
            // TODO: Notify customer that a driver is on the way
        } else {
            console.log(`Ride ${rideId}: Race condition - ride was already taken. Driver ${driverId} is free again.`);
            // This driver is now free, maybe trigger a search for them for another ride
        }
    } catch (error) {
        console.error(`Error confirming ride ${rideId} for driver ${driverId}:`, error);
    }
};

export const handleDriverReject = async (rideId: number, driverId: number) => {
    // Implementation for when a driver explicitly rejects the ride notification
};

export const handleRideCancellation = async (rideId: number) => {
    const ride = await Ride.findByPk(rideId);
    if (!ride || ride.status === 'completed' || ride.status === 'cancelled') return;

    const config = await getConfig('global');
    let finalStatus: RideStatus = 'cancelled';

    // Check for cancellation penalty
    if (ride.status === 'confirmed') {
        const timeSinceConfirmation = (new Date().getTime() - ride.updatedAt.getTime()) / 1000; // in seconds
        if (timeSinceConfirmation > (config?.cancellationGracePeriod || 60)) {
            finalStatus = 'cancelled_with_penalty';
            // TODO: Apply penalty fee to the user
            console.log(`Ride ${rideId}: Cancelled by user with a penalty.`);
        }
    }

    await updateRideStatus(rideId, finalStatus);
    console.log(`Ride ${rideId}: Cancelled.`);

    // TODO: Notify the other party (driver or customer)
};
