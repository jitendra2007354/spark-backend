
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { processMockPayment } from '../services/payment.service';
import { unblockDriver } from '../services/driver.service';

/**
 * Handles the mock payment request from a driver.
 */
export const makePayment = async (req: AuthenticatedRequest, res: Response) => {
    const driverId = req.user!.id; // Assuming auth middleware provides the user
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    try {
        const paymentResult = await processMockPayment(driverId, amount);

        if (paymentResult.success) {
            // If payment is successful, unblock the driver
            await unblockDriver(driverId);
            res.status(200).json({ success: true, message: 'Payment successful and driver unblocked.' });
        } else {
            res.status(400).json({ success: false, message: paymentResult.message });
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, message: 'An internal error occurred during payment processing.' });
    }
};
