import { Request, Response } from 'express';
import Ride from '../models/ride.model';
import User from '../models/user.model';
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
