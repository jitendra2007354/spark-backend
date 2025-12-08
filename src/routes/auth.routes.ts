
import { Router } from 'express';
import { login, guestLogin, me, adminLogin } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Route to log in or register a user with Google OAuth data
router.post('/login', login);

// Route for guest login
router.post('/guest-login', guestLogin);

// Route for admin login
router.post('/admin-login', adminLogin);

// Route to get the current user
router.get('/me', protect, me);

export default router;
