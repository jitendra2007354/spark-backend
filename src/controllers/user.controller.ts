import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcrypt';

// We need to hash passwords, so let's add bcrypt
// Please run: npm install bcrypt @types/bcrypt

/**
 * Register a new user
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phoneNumber, password, userType } = req.body;

    // 1. Validate input
    if (!firstName || !lastName || !phoneNumber || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this phone number already exists' });
    }

    // 3. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the new user
    const newUser = await User.create({
      firstName,
      lastName,
      phoneNumber,
      userType: userType || 'Customer',
      password: hashedPassword,
    });

    // 5. Respond with the created user (excluding password)
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);

  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
