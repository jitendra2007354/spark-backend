
import { sign } from 'jsonwebtoken';
import User from '../models/user.model';
import Driver from '../models/driver.model';
import sequelize from './database.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

// This interface includes all possible fields from both customer and driver apps
interface LoginData {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    pfp?: string;
    city?: string;
    state?: string;
    
    // Driver-specific fields
    driverLicenseNumber?: string;
    driverLicensePhotoUrl?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    vehicleType?: 'Bike' | 'Auto' | 'Car' | 'Car 6-Seater';
    rcPhotoUrl?: string;
}

/**
 * Handles login or registration for both Customers and Drivers in a single transaction.
 */
export const loginOrRegister = async (data: LoginData) => {
  const {
    phoneNumber, firstName, lastName, email, pfp, city, state,
    driverLicenseNumber, driverLicensePhotoUrl, vehicleModel, vehicleNumber, vehicleType, rcPhotoUrl
  } = data;

  if (!phoneNumber || !firstName || !lastName) {
      throw new Error('Phone number and name are required.');
  }

  // Determine userType based on the presence of essential driver data
  const isDriver = !!(driverLicenseNumber && driverLicensePhotoUrl && vehicleModel && vehicleNumber && vehicleType && rcPhotoUrl);
  const userType = isDriver ? 'Driver' : 'Customer';

  const transaction = await sequelize.transaction();

  try {
    // Find or create the user record
    const [user, created] = await User.findOrCreate({
      where: { phoneNumber },
      defaults: {
        firstName,
        lastName,
        phoneNumber,
        email,
        pfp,
        city,
        state,
        userType,
        isOnline: true, // Drivers start as online by default
      },
      transaction: transaction,
    });

    // If the user is a driver and was newly created, create their associated driver profile
    if (isDriver && created) {
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

    // If a user already exists but tries to register with a different role, block it.
    if (!created && user.userType !== userType) {
        await transaction.rollback();
        throw new Error(`A ${user.userType} account with this phone number already exists.`);
    }
    
    // Commit the transaction if everything is successful
    await transaction.commit();

    // Generate a JWT token for the session
    const token = sign({ id: user.id, phoneNumber: user.phoneNumber, userType: user.userType }, JWT_SECRET, { expiresIn: '30d' });

    return { user, token };

  } catch (error) {
    await transaction.rollback();
    console.error('Error in loginOrRegister service:', error);
    throw error; // Re-throw the error to be caught by the controller
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
export const loginAdmin = async (password: string) => {
  const HARDCODED_ADMIN_PASSWORD = "Jitendrasinghchauhan2007@sparkadmin"; 

  if (password !== HARDCODED_ADMIN_PASSWORD) {
      throw new Error('Invalid admin password.');
  }

  const token = sign({ id: 'admin', userType: 'Admin' }, JWT_SECRET, { expiresIn: '1d' });

  return { token, user: { id: 'admin', firstName: 'Admin', userType: 'Admin' } };
};
