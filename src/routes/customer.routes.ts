import { Router } from 'express';
import { getCustomerRides } from '../controllers/customer.controller';
import { protect, isCustomer } from '../middleware/auth.middleware';

const router = Router();

// All customer routes are for authenticated customers
router.use(protect, isCustomer);

// GET /api/customer/rides - Get the ride history for the currently logged-in customer
router.get('/rides', getCustomerRides);

export default router;
