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
        attributes: ['id', 'vehicleModel', 'vehicleType', 'rating'],
      }],
      order: [['amount', 'ASC']],
    });
  } catch (error) {
    console.error(`ERROR: Failed to retrieve bids for ride ${rideId}:`, error);
    return [];
  }
};

/**
 * Accepts a bid, updates the ride, and notifies the driver.
 */
export const acceptBid = async (bidId: number, customerId: number): Promise<{ message: string }> => {
  const transaction = await sequelize.transaction();

  try {
    const bid = await Bid.findByPk(bidId, { transaction });

    if (!bid) {
      throw new Error('Bid not found');
    }
    
    const ride = await Ride.findByPk(bid.rideId, { transaction });

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.customerId !== customerId) {
      throw new Error('You are not authorized to accept this bid.');
    }

    if (ride.status !== 'pending') {
      throw new Error('This ride is no longer available for bidding.');
    }

    // Update the bid and ride
    bid.isAccepted = true;
    await bid.save({ transaction });

    await Ride.update({
      status: 'accepted' as RideStatus,
      driverId: bid.driverId,
      finalFare: bid.amount,
    }, { where: { id: bid.rideId }, transaction });

    // Notify the winning driver
    sendMessageToUser(bid.driverId, 'bid-accepted', { 
      rideId: bid.rideId,
      message: 'Your bid has been accepted!'
    });
    
    // Reject all other bids for this ride
    const otherBids = await Bid.findAll({ 
        where: { rideId: bid.rideId, id: { [Op.ne]: bidId } },
        transaction
    });

    for (const otherBid of otherBids) {
        sendMessageToUser(otherBid.driverId, 'bid-rejected', { 
            rideId: bid.rideId,
            message: 'Your bid was not selected.'
        });
    }

    await transaction.commit();

    return { message: 'Bid accepted successfully.' };
  } catch (error) {
    await transaction.rollback();
    console.error(`ERROR: Failed to accept bid ${bidId}:`, error);
    throw error;
  }
};
