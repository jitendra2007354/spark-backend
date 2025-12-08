import { Router } from 'express';
// We will create this controller next
import { registerUser } from '../controllers/user.controller';

const router = Router();

// Define the registration route
// POST /api/users/register
router.post('/register', registerUser);

export default router;
