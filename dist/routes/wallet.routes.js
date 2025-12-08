"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_service_1 = require("../services/wallet.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/wallet/balance - Driver gets their own wallet balance
router.get('/balance', auth_middleware_1.protect, auth_middleware_1.isDriver, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const balance = yield (0, wallet_service_1.getDriverWalletBalance)(userId);
        res.json({ balance });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve wallet balance.', message: error.message });
    }
}));
// POST /api/wallet/top-up - Driver adds funds to their wallet
router.post('/top-up', auth_middleware_1.protect, auth_middleware_1.isDriver, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { amount } = req.body;
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'A valid positive amount is required for top-up.' });
        }
        const updatedDriver = yield (0, wallet_service_1.topUpWallet)(userId, amount);
        res.json({ message: 'Wallet topped up successfully.', newBalance: updatedDriver.walletBalance });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to top up wallet.', message: error.message });
    }
}));
// POST /api/wallet/admin/adjust - Admin manually adjusts a driver's wallet
router.put('/admin/adjust', auth_middleware_1.protect, auth_middleware_1.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { driverId, amount } = req.body;
        if (!driverId || amount === undefined) {
            return res.status(400).json({ error: 'driverId and amount are required.' });
        }
        const updatedDriver = yield (0, wallet_service_1.updateUserWallet)(driverId, amount);
        res.json({
            message: `Wallet for driver ${driverId} adjusted successfully.`,
            newBalance: updatedDriver.walletBalance,
            isBlocked: updatedDriver.isBlocked
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to adjust wallet.', message: error.message });
    }
}));
exports.default = router;
