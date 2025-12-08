
import { Router } from 'express';
import {
  getSystemConfig,
  updateSystemConfig,
  getAllUsers,
  createUser,
  getPricing,
  addPricingRule,
  deletePricingRule,
  getTickets,
  getDriverLocations,
  getNotificationHistory,
  sendNotification,
  getAIAssistantResponse,
  createRealtimeNotificationHandler // Import the new handler
} from '../controllers/admin.controller';
import { protect, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require an authenticated admin user
router.use(protect, isAdmin);

// --- AI ASSISTANT ---
router.post('/ai/generate', getAIAssistantResponse);

// GET /api/admin/config - Get all system settings
router.get('/config', getSystemConfig);

// POST /api/admin/config - Update one or more system settings
router.post('/config', updateSystemConfig);

// GET /api/admin/users - Get all users
router.get('/users', getAllUsers);

// POST /api/admin/users - Create a new user
router.post('/users', createUser);

// --- Pricing ---
// GET /api/admin/pricing - Get all pricing rules
router.get('/pricing', getPricing);

// POST /api/admin/pricing/:type - Add a new pricing rule of a specific type
router.post('/pricing/:type', addPricingRule);

// DELETE /api/admin/pricing/:type/:id - Delete a pricing rule of a specific type
router.delete('/pricing/:type/:id', deletePricingRule);


// GET /api/admin/tickets - Get all support tickets
router.get('/tickets', getTickets);

// GET /api/admin/drivers/locations - Get live driver locations
router.get('/drivers/locations', getDriverLocations);

// --- Notifications (Existing) ---
// GET /api/admin/notifications/history - Get notification history
router.get('/notifications/history', getNotificationHistory);

// POST /api/admin/notifications - Send a new notification (saves to DB)
router.post('/notifications', sendNotification);


// --- Real-time Notifications (New) ---
// POST /api/admin/notifications-v2 - Send a live notification via WebSocket
router.post('/notifications-v2', createRealtimeNotificationHandler);


export default router;
