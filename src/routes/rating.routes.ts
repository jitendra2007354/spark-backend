import { Router } from 'express';
import { createRatingController, getRatingsController } from '../controllers/rating.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Route to submit a new rating for a ride
// POST /api/ratings
router.post('/', protect, createRatingController);

// Route to get all ratings for a user (driver)
// GET /api/ratings/:userId
router.get('/:userId', protect, getRatingsController);

export default router;
