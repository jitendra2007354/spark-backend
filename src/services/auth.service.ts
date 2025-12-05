import { sign } from 'jsonwebtoken';
import User from '../models/user.model';
import Driver from '../models/driver.model';
import sequelize from './database.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// This interface includes all possible user and driver fields
interface LoginData {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    pfp?: string;
    city?: string;
    state?: string;
    
    // Driver-specific fields are optional
    driverLicenseNumber?: string;
    driverLicensePhotoUrl?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    vehicleType?: 'Bike' | 'Auto' | 'Car' | 'Car 6-Seater';
    rcPhotoUrl?: string;
}

/**
 * Handles login or registration for both Customers and Drivers.
 */
export const loginOrRegister = async (data: LoginData) => {
  const {
    phoneNumber, firstName, lastName, email, pfp, city, state,
    driverLicenseNumber, driverLicensePhotoUrl, 
    vehicleModel, vehicleNumber, vehicleType, rcPhotoUrl
  } = data;

  if (!phoneNumber || !firstName || !lastName) {
      throw new Error('Phone number, first name, and last name are required.');
  }

  // Determine userType based on the presence of essential driver data
  const isDriver = !!(driverLicenseNumber && driverLicensePhotoUrl && vehicleNumber && vehicleType && vehicleModel && rcPhotoUrl);
  const userType = isDriver ? 'Driver' : 'Customer';

  // Use a transaction for atomicity
  const transaction = await sequelize.transaction();

  try {
    // Step 1: Find or Create the User
    const [user, created] = await User.findOrCreate({
      where: { phoneNumber },
      defaults: {
        firstName,
        lastName,
        phoneNumber,
        email: email,
        pfp: pfp,
        city: city,
        state: state,
        isOnline: true,
        userType: userType, // Set userType dynamically
      },
      transaction: transaction,
    });

    // If the user is a driver and was just created, create their driver profile
    if (isDriver && created) {
      if (!driverLicenseNumber || !driverLicensePhotoUrl) { // Redundant check, but safe
          throw new Error('Driver license number and photo are required for driver registration.');
      }
      await Driver.create({
        userId: user.id,
        driverLicenseNumber: driverLicenseNumber!,
        driverLicensePhotoUrl: driverLicensePhotoUrl!,
        vehicleModel: vehicleModel!,
        vehicleNumber: vehicleNumber!,
        vehicleType: vehicleType!,
        rcPhotoUrl: rcPhotoUrl!,
      }, { transaction: transaction });
    }

    // Handle userType conflicts for existing users
    if (!created && user.userType !== userType) {
        await transaction.rollback();
        throw new Error(`User with phone number ${phoneNumber} already exists as a ${user.userType}.`);
    }

    // Commit the transaction
    await transaction.commit();

    // Generate a JWT token
    const token = sign({ id: user.id, phoneNumber: user.phoneNumber, userType: user.userType }, JWT_SECRET, { expiresIn: '30d' });

    return { user, token };

  } catch (error) {
    await transaction.rollback();
    console.error('Error in loginOrRegister service:', error);
    throw error;
  }
};

/**
 * Creates a temporary guest user (for customers).
 */
export const loginGuest = async () => {
    const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    const guestPhoneNumber = `+${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const user = await User.create({
      firstName: 'Guest',
      lastName: 'User',
      phoneNumber: guestPhoneNumber,
      email: `${guestId}@spark.ride`,
      userType: 'Customer',
      isOnline: true,
    });
  
    const token = sign({ id: user.id, userType: user.userType }, JWT_SECRET, { expiresIn: '1d' });
    return { user, token };
};

/**
 * Logs in an admin user.
 */
// src/services/auth.service.ts

/**
 * Logs in an admin user.
 */
export const loginAdmin = async (password: string) => {
  // Hardcode the password directly here for demonstration/testing
  const HARDCODED_ADMIN_PASSWORD = "Jitendrasinghchauhan2007@sparkadmin"; // NOT RECOMMENDED FOR PRODUCTION

  if (password !== HARDCODED_ADMIN_PASSWORD) {
      throw new Error('Invalid admin password.');
  }

  // Generate a JWT token for the admin
  // Make sure JWT_SECRET is also defined, perhaps as an environment variable or hardcoded for testing too.
  const token = sign({ id: 'admin', userType: 'Admin' }, JWT_SECRET, { expiresIn: '1d' });

  return { token, user: { id: 'admin', firstName: 'Admin', userType: 'Admin' } };
};


export const loginWithGoogle = async (googleData: any) => {
  // Implement Google login logic here
  return { user: null, token: null };
}
