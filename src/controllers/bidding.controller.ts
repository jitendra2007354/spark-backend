import { Request, Response } from 'express';
import { createBid, getBidsForRide, acceptBid } from '../services/bidding.service';
import Ride from '../models/ride.model';
import User from '../models/user.model'; // Import the User model

/**
 * Controller to handle the creation of a new bid by a driver.
 */
export const createBidController = async (req: Request, res: Response) => {
  const { rideId, amount } = req.body;
  const driverId = req.user!.id;
  const userType = req.user!.userType;

  // 1. Authorization: Ensure the user is a driver
  if (userType !== 'Driver') {
    return res.status(403).json({ message: 'Forbidden: Only drivers can place bids' });
  }

  // 2. Input Validation
  if (!rideId || amount === undefined || amount <= 0) {
    return res.status(400).json({ message: 'Missing or invalid required fields: rideId and amount.' });
  }

  try {
    // 3. Find the ride to get the customerId for notification
    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    // Ensure the ride is actually available for bidding
    if (ride.status !== 'pending') {
        return res.status(400).json({ message: 'This ride is no longer available for bidding.' });
    }

    // 4. Create the bid and notify the customer
    const customerId = ride.customerId;
    const bid = await createBid(rideId, driverId, amount, customerId);

    res.status(201).json(bid);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error in createBidController: ${errorMessage}`);
    res.status(500).json({ message: 'Failed to create bid.', error: errorMessage });
  }
};

/**
 * Controller to retrieve all bids for a specific ride.
 */
export const getBidsController = async (req: Request, res: Response) => {
  const { rideId } = req.params;
  try {
    const bids = await getBidsForRide(Number(rideId));
    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve bids.', error });
  }
};

/**
 * Controller for a customer to accept a bid.
 */
export const acceptBidController = async (req: Request, res: Response) => {
  const { bidId } = req.body;
  const customerId = req.user!.id;
  const userType = req.user!.userType;

  // 1. Authorization: Ensure the user is a customer
  if (userType !== 'Customer') {
    return res.status(403).json({ message: 'Forbidden: Only customers can accept bids' });
  }

  // 2. Input validation
  if (!bidId) {
    return res.status(400).json({ message: 'Missing required field: bidId' });
  }

  try {
    const result = await acceptBid(bidId, customerId);
    res.status(200).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error in acceptBidController: ${errorMessage}`);
    res.status(500).json({ message: 'Failed to accept bid.', error: errorMessage });
  }
};
