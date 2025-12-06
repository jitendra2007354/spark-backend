import { Request, Response } from 'express';
import User from '../models/user.model';

/**
 * Register a new user.
 * This controller is simplified to not use passwords, aligning with the passwordless login flow.
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phoneNumber, userType } = req.body;

    // 1. Validate input (password is no longer required)
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ message: 'First name, last name, and phone number are required' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this phone number already exists' });
    }

    // 3. Create the new user (without password)
    const newUser = await User.create({
      firstName,
      lastName,
      phoneNumber,
      userType: userType || 'Customer', // Default to 'Customer' if not provided
    });

    // 4. Respond with the created user
    // The password field is gone, so no need to delete it from the response
    res.status(201).json(newUser);

  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
