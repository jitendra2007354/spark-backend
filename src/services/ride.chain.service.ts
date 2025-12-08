
import { Op } from 'sequelize';
import Ride, { RideStatus } from '../models/ride.model';
import { findNearestAvailableDriver } from './location.service';
import { getApplicableConfig } from './config.service';
import { sendMessageToUser } from './websocket.service';
import { calculateFare } from './fare.service';
import User from '../models/user.model';
import Driver from '../models/driver.model';
import { VehicleType } from '../models/vehicle.model';

const offerTimers = new Map<number, NodeJS.Timeout>();

async function handleOfferExpiration(rideId: number) {
    const ride = await Ride.findByPk(rideId);

    if (!ride || ride.status !== RideStatus.ASSIGNING || !ride.offerExpiresAt || new Date() < ride.offerExpiresAt) {
        return;
    }

    console.log(`Offer for ride ${rideId} to driver ${ride.currentDriverId} has expired.`);

    const driverId = ride.currentDriverId;
    const currentRejected = ride.rejectedDriverIds || [];

    await ride.update({
        status: RideStatus.PENDING,
        rejectedDriverIds: [...currentRejected, driverId],
        currentDriverId: null,
        offerExpiresAt: null
    });

    findAndOfferToNextDriver(rideId);
}

async function findAndOfferToNextDriver(rideId: number) {
    const ride = await Ride.findByPk(rideId);

    if (!ride || ride.status !== RideStatus.PENDING) {
        console.log(`Assignment chain for ride ${rideId} stopped. Status: ${ride?.status}`);
        return;
    }

    const rejectedDrivers = ride.rejectedDriverIds || [];
    const nextDriver = await findNearestAvailableDriver(
        ride.pickupLocation.latitude,
        ride.pickupLocation.longitude,
        ride.vehicleType as VehicleType,
        rejectedDrivers
    );

    if (nextDriver) {
        console.log(`Offering ride ${rideId} to driver ${nextDriver.id}`);
        const config = await getApplicableConfig();
        const offerExpiresAt = new Date(Date.now() + config.rideAcceptTime * 1000);

        await ride.update({
            status: RideStatus.ASSIGNING,
            currentDriverId: nextDriver.id,
            offerExpiresAt: offerExpiresAt,
        });

        sendMessageToUser(nextDriver.userId, 'new_ride_offer', { rideId: ride.id, details: ride, timeout: config.rideAcceptTime });

        const timer = setTimeout(() => handleOfferExpiration(ride.id), config.rideAcceptTime * 1000);
        offerTimers.set(ride.id, timer);
    } else {
        console.log(`No available drivers for ride ${rideId}.`);
        await ride.update({ status: RideStatus.CANCELLED });
        sendMessageToUser(ride.customerId, 'ride_update', { rideId: ride.id, status: RideStatus.CANCELLED, message: 'No available drivers found.' });
    }
}

export async function startRideAssignment(rideId: number) {
    const ride = await Ride.findByPk(rideId);
    if (!ride) return;

    await findAndOfferToNextDriver(rideId);
}

export async function handleDriverAccept(rideId: number, driverId: number) {
    const ride = await Ride.findByPk(rideId);

    // This was the source of a build error. Added a check for ride.offerExpiresAt.
    if (!ride || ride.status !== RideStatus.ASSIGNING || ride.currentDriverId !== driverId || !ride.offerExpiresAt || new Date() > ride.offerExpiresAt) {
        sendMessageToUser(driverId, 'offer_expired', { rideId });
        return;
    }

    console.log(`Driver ${driverId} accepted ride ${rideId}`);

    const timer = offerTimers.get(rideId);
    if (timer) {
        clearTimeout(timer);
        offerTimers.delete(rideId);
    }

    await ride.update({
        status: RideStatus.ACCEPTED,
        driverId: driverId,
        currentDriverId: null,
        offerExpiresAt: null
    });

    sendMessageToUser(ride.customerId, 'ride_accepted', { rideId, driverId, details: ride });
    sendMessageToUser(driverId, 'ride_confirmed', { rideId, details: ride });
}

export async function handleDriverReject(rideId: number, driverId: number) {
    const ride = await Ride.findByPk(rideId);

    if (!ride || ride.status !== RideStatus.ASSIGNING || ride.currentDriverId !== driverId) {
        return;
    }

    console.log(`Driver ${driverId} rejected ride ${rideId}`);

    const timer = offerTimers.get(rideId);
    if (timer) {
        clearTimeout(timer);
        offerTimers.delete(rideId);
    }

    const currentRejected = ride.rejectedDriverIds || [];
    await ride.update({
        status: RideStatus.PENDING,
        rejectedDriverIds: [...currentRejected, driverId],
        currentDriverId: null,
        offerExpiresAt: null
    });

    findAndOfferToNextDriver(rideId);
}

export async function handleRideCancellation(rideId: number, cancelledBy: 'Customer' | 'Driver') {
    const ride = await Ride.findByPk(rideId);
    if (!ride || [RideStatus.CANCELLED, RideStatus.COMPLETED].includes(ride.status)) return;

    console.log(`Ride ${rideId} cancelled by ${cancelledBy}`);

    const timer = offerTimers.get(rideId);
    if (timer) {
        clearTimeout(timer);
        offerTimers.delete(rideId);
    }

    await ride.update({ status: RideStatus.CANCELLED });

    sendMessageToUser(ride.customerId, 'ride_cancelled', { rideId, cancelledBy });
    if (ride.driverId) {
        const driver = await Driver.findByPk(ride.driverId);
        if (driver) sendMessageToUser(driver.userId, 'ride_cancelled', { rideId, cancelledBy });
    }
    if (ride.currentDriverId) {
         const driver = await Driver.findByPk(ride.currentDriverId);
        if (driver) sendMessageToUser(driver.userId, 'ride_cancelled', { rideId, cancelledBy });
    }
}

export async function handleRideCompletion(rideId: number) {
    const ride = await Ride.findByPk(rideId, { include: [{ model: Driver, as: 'driver' }] });
    if (!ride || !ride.driver || ride.status !== RideStatus.ACCEPTED) {
        console.error(`Cannot complete ride ${rideId}. Invalid state.`);
        return;
    }

    await ride.update({ status: RideStatus.COMPLETED });

    const config = await getApplicableConfig();
    const commissionRate = config.commissionRate || 0;
    const driver = ride.driver;
    let commission = 0;

    if (commissionRate > 0) {
        commission = ride.fare * (commissionRate / 100);
        const newOutstandingCommission = (driver.outstandingPlatformFee || 0) + commission;
        await driver.update({ outstandingPlatformFee: newOutstandingCommission });
        sendMessageToUser(driver.userId, 'commission_charged', { rideId, commission, totalOutstanding: newOutstandingCommission });
    }

    sendMessageToUser(ride.customerId, 'ride_completed', { rideId, fare: ride.fare });
    sendMessageToUser(driver.userId, 'ride_completed', { rideId, fare: ride.fare, commission: commission });

    console.log(`Ride ${rideId} has been successfully completed.`);
}
