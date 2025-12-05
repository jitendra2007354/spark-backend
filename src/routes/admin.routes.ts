
import { Router } from 'express';
import {
  getSystemConfig,
  updateSystemConfig,
  getAllUsers,
  getPricing,
  getTickets,
  getDriverLocations,
  getNotificationHistory,
} from '../controllers/admin.controller';
import { protect, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require an authenticated admin user
router.use(protect, isAdmin);

// GET /api/admin/config - Get all system settings
router.get('/config', getSystemConfig);

// POST /api/admin/config - Update one or more system settings
router.post('/config', updateSystemConfig);

// GET /api/admin/users - Get all users
router.get('/users', getAllUsers);

// GET /api/admin/pricing - Get all pricing rules
router.get('/pricing', getPricing);

// GET /api/admin/tickets - Get all support tickets
router.get('/tickets', getTickets);

// GET /api/admin/drivers/locations - Get live driver locations
router.get('/drivers/locations', getDriverLocations);

// GET /api/admin/notifications/history - Get notification history
router.get('/notifications/history', getNotificationHistory);

export default router;
