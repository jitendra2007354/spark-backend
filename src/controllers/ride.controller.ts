import { Request, Response } from 'express';
import Ride, { RideStatus } from '../models/ride.model';
import User from '../models/user.model';
import { confirmRide as confirmRideService, updateRideStatus as updateRideStatusService } from '../services/ride.service';
import { getDistanceAndDuration } from '../services/googleMaps.service';

// @desc    Create a new ride request
// @route   POST /api/rides
// @access  Private (Customer)
export const createRide = async (req: Request, res: Response) => {
  const { pickupLocation, dropoffLocation, pickupAddress, dropoffAddress, vehicleType } = req.body;
  const customerId = (req.user as User).id;

  // 1. Input Validation
  if (!pickupLocation || !dropoffLocation || !pickupAddress || !dropoffAddress || !vehicleType) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // In a real app, you might get an estimated fare here using a service like Google Maps
    // For now, we will just create the ride request

    const newRide = await Ride.create({
      customerId,
      pickupLocation,
      dropoffLocation,
      pickupAddress,
      dropoffAddress,
      vehicleType,
      status: 'pending',
    });

    // TODO: Notify nearby drivers via WebSocket or a push notification service

    res.status(201).json(newRide);
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ message: 'Server error while creating ride' });
  }
};

// @desc    Get all available (pending) rides
// @route   GET /api/rides/available
// @access  Private (Driver)
export const getAvailableRides = async (req: Request, res: Response) => {
  try {
    const availableRides = await Ride.findAll({
      where: { status: 'pending' },
      include: [{
        model: User,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture'], // Include customer details
      }],
      order: [['createdAt', 'DESC']], // Show newest requests first
    });

    res.status(200).json(availableRides);
  } catch (error) {
    console.error('Error fetching available rides:', error);
    res.status(500).json({ message: 'Server error while fetching rides' });
  }
};

// @desc    Confirm a ride after a bid has been accepted
// @route   POST /api/rides/:rideId/confirm
// @access  Private (Customer)
export const confirmRide = async (req: Request, res: Response) => {
  const { rideId } = req.params;
  const customerId = (req.user as User).id;

  try {
    const confirmedRide = await confirmRideService(parseInt(rideId, 10), customerId);
    res.status(200).json(confirmedRide);
  } catch (error: any) {
    console.error('Error confirming ride:', error);
    // Provide a more specific error message if available
    res.status(400).json({ message: error.message || 'Failed to confirm ride' });
  }
};

// @desc    Update the status of a ride (e.g., arrived, enroute, completed)
// @route   PATCH /api/rides/:rideId/status
// @access  Private (Driver)
export const updateRideStatus = async (req: Request, res: Response) => {
    const { rideId } = req.params;
    const { status } = req.body;
    const driverId = (req.user as User).id;

    if (!status) {
        return res.status(400).json({ message: 'Missing status field' });
    }

    try {
        const updatedRide = await updateRideStatusService(parseInt(rideId, 10), driverId, status as RideStatus);
        res.status(200).json(updatedRide);
    } catch (error: any) {
        console.error('Error updating ride status:', error);
        res.status(400).json({ message: error.message || 'Failed to update ride status' });
    }
};
