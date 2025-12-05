import { Router } from 'express';
import { sendToUser, sendToGroup, sendToAllUsers } from '../controllers/notification.controller';

const router = Router();

// Admin: Send notification to a specific user
router.post('/user', sendToUser);

// Admin: Send notification to a group of users (customers or drivers)
router.post('/group', sendToGroup);

// Admin: Send notification to all users
router.post('/all', sendToAllUsers);

export default router;
