import { Op } from 'sequelize';
import Bid from '../models/bid.model';
import Ride, { RideStatus } from '../models/ride.model';
import Driver from '../models/driver.model'; // Import the Driver model
import { sendMessageToUser } from './websocket.service';
import sequelize from './database.service'; // Import sequelize for transactions

/**
 * Creates a new bid for a ride and notifies the customer.
 */
export const createBid = async (rideId: number, driverId: number, amount: number, customerId: number): Promise<Bid> => {
  try {
    const bid = await Bid.create({ rideId, driverId: driverId, amount });

    sendMessageToUser(customerId, 'bid-new', { 
      rideId,
      bidId: bid.id,
      driverId,
      amount 
    });

    return bid;
  } catch (error) {
    console.error(`ERROR: Failed to create bid for ride ${rideId}:`, error);
    throw new Error('Failed to create bid.');
  }
};

/**
 * Retrieves all bids for a specific ride, including driver details.
 */
export const getBidsForRide = async (rideId: number): Promise<Bid[]> => {
  try {
    return await Bid.findAll({
      where: { rideId },
      include: [{
        model: Driver,
        as: 'driver',
        // It's good practice to select only the attributes you need
        attributes: ['id', 'vehicleModel', 'vehicleType', 'averageRating'],
      }],
      order: [['amount', 'ASC']],
    });
  } catch (error) {
    console.error(`ERROR: Failed to retrieve bids for ride ${rideId}:`, error);
    return [];
  }
};

/**
 * Accepts a bid, updates the ride, and notifies all relevant drivers.
 * CORRECTED: This function now uses the correct Ride model properties and statuses.
 */
export const acceptBid = async (bidId: number, customerId: number): Promise<{ message: string }> => {
  const transaction = await sequelize.transaction();

  try {
    const winningBid = await Bid.findByPk(bidId, { transaction });

    if (!winningBid) {
      throw new Error('Bid not found');
    }
    
    const ride = await Ride.findByPk(winningBid.rideId, { transaction });

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.customerId !== customerId) {
      throw new Error('You are not authorized to accept this bid.');
    }

    // The status must be PENDING to accept a bid.
    if (ride.status !== RideStatus.PENDING) {
      throw new Error('This ride is no longer available for bidding.');
    }

    // 1. Update the winning bid's status
    winningBid.isAccepted = true;
    await winningBid.save({ transaction });

    // 2. Update the ride with the winning driver and fare
    // Using the correct RideStatus enum and 'fare' property
    ride.status = RideStatus.ACCEPTED;
    ride.driverId = winningBid.driverId;
    ride.fare = winningBid.amount; // The 'fare' field is used for the final amount
    await ride.save({ transaction });

    // 3. Notify the winning driver
    sendMessageToUser(winningBid.driverId, 'bid-accepted', { 
      rideId: ride.id,
      message: 'Your bid was accepted! The ride is now assigned to you.'
    });
    
    // 4. Notify all other drivers that their bid was rejected
    // Fetch all bids for the ride separately, as the association was removed.
    const allBids = await Bid.findAll({ where: { rideId: ride.id }, transaction });
    for (const bid of allBids) {
      if (bid.id !== winningBid.id) {
        sendMessageToUser(bid.driverId, 'bid-rejected', { 
            rideId: ride.id,
            message: 'Your bid for this ride was not selected.'
        });
      }
    }

    await transaction.commit();

    return { message: 'Bid accepted successfully and all drivers notified.' };
  } catch (error) {
    await transaction.rollback();
    console.error(`ERROR: Failed to accept bid ${bidId}:`, error);
    throw error;
  }
};
