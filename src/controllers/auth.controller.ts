
import { Request, Response } from 'express';
import { loginOrRegister, loginGuest, loginAdmin } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Handles the /login request.
 * Creates a new user or logs in an existing user.
 */
export const login = async (req: Request, res: Response) => {
  // Consolidate all body data into a single object for the service
  const loginData = req.body;

  try {
    const result = await loginOrRegister(loginData);
    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Error in login controller:', error);
    // Send a more specific error message to the client
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
};

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
