import { Request, Response } from 'express';
import { setConfig } from '../services/config.service';
import User from '../models/user.model';

// Placeholder for a real pricing service
const getPricingRulesFromDb = async () => Promise.resolve({
  base: [{ id: '1', scope: 'Global', baseRate: 50, perUnit: 12, vehicleType: 'Car 4 Seater' }],
  commission: [{ id: '1', scope: 'Global', amount: 15, perRides: 1 }],
  tax: [{ id: '1', scope: 'Global', name: 'GST', value: 5, type: 'Percentage' }],
  penalty: [{ id: '1', scope: 'Global', role: 'Driver', cancelLimit: 3, penaltyAmount: 100 }],
  timings: [{ id: '1', scope: 'Global', acceptTime: 45 }],
});

// Placeholder for a real tickets service
const getTicketsFromDb = async () => Promise.resolve([
  { id: '1', subject: 'Payment Issue', userName: 'Ravi Kumar', userAvatar: 'https://i.pravatar.cc/150?u=ravi', userRole: 'Customer', userMobile: '+919876543210', location: 'Mumbai, MH', description: 'My last payment was deducted twice from my account.', status: 'Open', timestamp: '2 days ago' },
]);

// Placeholder for real driver location service
const getDriverLocationsFromDb = async () => Promise.resolve([
    { id: 'DRIVER_1', lat: 19.0760, lng: 72.8777 },
    { id: 'DRIVER_2', lat: 28.6139, lng: 77.2090 },
]);

// Placeholder for real notification history service
const getNotificationHistoryFromDb = async () => Promise.resolve([
    { title: 'Welcome Bonus!', message: 'Get 50% off your next 3 rides.', target: 'All Customers', timestamp: '2024-05-20 10:00 AM' },
]);

/**
 * Handles the request to get all users.
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({ raw: true }); // Use raw: true to get plain objects
    // In a real app, you'd add revenue, bookings etc. here via joins or separate queries
    const enrichedUsers = users.map(u => ({ 
        ...u, 
        avatar: u.pfp || `https://i.pravatar.cc/150?u=${u.email}`,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        bookings: Math.floor(Math.random() * 100),
        totalSpend: Math.floor(Math.random() * 3000),
        earnings: Math.floor(Math.random() * 4000),
        penalty: 0,
        signupDate: (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'),
        plan: 'Standard',
        status: u.isBlocked ? 'Blocked' : 'Active',
        role: u.userType, // Map userType to role
    }));
    res.status(200).json(enrichedUsers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users.', message: error.message });
  }
};

/**
 * Handles the request to get all pricing rules.
 */
export const getPricing = async (req: Request, res: Response) => {
  try {
    const pricing = await getPricingRulesFromDb();
    res.status(200).json(pricing);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve pricing.', message: error.message });
  }
};

/**
 * Handles the request to get all support tickets.
 */
export const getTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await getTicketsFromDb();
        res.status(200).json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to retrieve tickets.', message: error.message });
    }
};

/**
 * Handles the request to get live driver locations.
 */
export const getDriverLocations = async (req: Request, res: Response) => {
    try {
        const locations = await getDriverLocationsFromDb();
        res.status(200).json(locations);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to retrieve driver locations.', message: error.message });
    }
};

/**
 * Handles the request to get notification history.
 */
export const getNotificationHistory = async (req: Request, res: Response) => {
    try {
        const history = await getNotificationHistoryFromDb();
        res.status(200).json(history);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to retrieve notification history.', message: error.message });
    }
};

// --- CONFIG --- //
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    res.status(200).json({}); // This remains a placeholder as per previous analysis
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve system configuration.', message: error.message });
  }
};

export const updateSystemConfig = async (req: Request, res: Response) => {
  const updates = req.body;
  try {
    await setConfig(updates);
    res.status(200).json({ message: 'Configuration updated successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update configuration.', message: error.message });
  }
};