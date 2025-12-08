import { Router, Request, Response } from 'express';
import {
  getDriverWalletBalance,
  topUpWallet,
  updateUserWallet
} from '../services/wallet.service';
import { protect, isAdmin, isDriver } from '../middleware/auth.middleware';

const router = Router();

// GET /api/wallet/balance - Driver gets their own wallet balance
router.get('/balance', protect, isDriver, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const balance = await getDriverWalletBalance(userId);
    res.json({ balance });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve wallet balance.', message: error.message });
  }
});

// POST /api/wallet/top-up - Driver adds funds to their wallet
router.post('/top-up', protect, isDriver, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'A valid positive amount is required for top-up.' });
    }

    const updatedDriver = await topUpWallet(userId, amount);
    res.json({ message: 'Wallet topped up successfully.', newBalance: updatedDriver.walletBalance });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to top up wallet.', message: error.message });
  }
});

// POST /api/wallet/admin/adjust - Admin manually adjusts a driver's wallet
router.put('/admin/adjust', protect, isAdmin, async (req: Request, res: Response) => {
  try {
    const { driverId, amount } = req.body;

    if (!driverId || amount === undefined) {
      return res.status(400).json({ error: 'driverId and amount are required.' });
    }

    const updatedDriver = await updateUserWallet(driverId, amount);
    res.json({
      message: `Wallet for driver ${driverId} adjusted successfully.`,
      newBalance: updatedDriver.walletBalance,
      isBlocked: updatedDriver.isBlocked
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to adjust wallet.', message: error.message });
  }
});

export default router;
