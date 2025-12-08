
import { Request, Response } from 'express';
import { loginOrRegister, loginGuest, loginAdmin } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Handles the /login request for both customers and drivers.
 * It now accepts pre-formatted data from the frontends.
 */
export const login = async (req: Request, res: Response) => {
  // Destructure fields directly. The frontends now send data in the correct format.
  const {
    phoneNumber, 
    firstName,
    lastName,
    email,
    pfp,
    city,
    state,
    vehicleType,
    vehicleModel,
    vehicleNumber,
    driverLicenseNumber,
    driverLicensePhotoUrl,
    rcPhotoUrl,
  } = req.body;

  // Consolidate the data for the service layer.
  // The controller no longer needs to perform transformations like splitting 'name'
  // or renaming 'mobile'.
  const loginData = {
    phoneNumber,
    firstName,
    lastName,
    email,
    pfp,
    city,
    state,
    driverLicenseNumber,
    driverLicensePhotoUrl,
    vehicleModel,
    vehicleNumber,
    vehicleType,
    rcPhotoUrl,
  };

  try {
    const result = await loginOrRegister(loginData);
    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Error in login controller:', error);
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
};

// --- OTHER AUTH FUNCTIONS (UNCHANGED) ---

export const guestLogin = async (req: Request, res: Response) => {
    try {
      const result = await loginGuest();
      res.status(200).json({
        message: 'Guest login successful',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error('Error in guestLogin controller:', error);
      res.status(500).json({ error: 'Failed to login as guest' });
    }
  };

  export const adminLogin = async (req: Request, res: Response) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        const result = await loginAdmin(password);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

  export const me = (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(req.user);
  };
