import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import User from '../models/user.model'; // Assuming User model definition is here

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

// Extend Express's Request interface to include the user property
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to verify JWT token and attach user to the request.
 */
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { id: number };
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
