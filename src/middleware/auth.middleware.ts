import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import User from '../models/user.model'; // Assuming User model definition is here

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

// Extend Express's Request interface to include the user property
export interface AuthenticatedRequest extends Request {
  user?: any; // Using any to accommodate both User model and admin object
}

/**
 * Middleware to verify JWT token and attach user to the request.
 * This now handles the special case for the 'admin' user.
 */
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { id: number | string, userType: string };

    // SPECIAL CASE: Handle the admin user, whose ID is a string 'admin'
    if (decoded.id === 'admin' && decoded.userType === 'Admin') {
      req.user = { id: 'admin', userType: 'Admin' };
      return next();
    }

    // STANDARD CASE: Handle regular users with numeric IDs from the database
    const user = await User.findByPk(decoded.id as number);

    if (!user) {
      // Return 401 Unauthorized because the token is for a user that does not exist.
      return res.status(401).json({ error: 'Unauthorized: User for this token not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// --- Role-based Authorization Middleware ---

export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'Admin') {
    return res.status(403).json({ error: 'Access forbidden. You must be an admin.' });
  }
  next();
};

export const isDriver = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'Driver') {
    return res.status(403).json({ error: 'Access forbidden. You must be a driver.' });
  }
  next();
};

export const isCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.userType !== 'Customer') {
    return res.status(403).json({ error: 'Access forbidden. You must be a customer.' });
  }
  next();
};
