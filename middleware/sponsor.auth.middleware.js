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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectSponsor = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sponsor_model_1 = __importDefault(require("../models/sponsor.model"));
const JWT_SECRET = process.env.JWT_SPONSOR_SECRET || 'a_very_secure_secret_for_sponsors';
const protectSponsor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.sponsor = (yield sponsor_model_1.default.findByPk(decoded.id, { attributes: { exclude: ['password'] } })) || undefined;
            if (!req.sponsor)
                return res.status(401).json({ message: 'Not authorized, sponsor not found' });
            next();
        }
        catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
});
exports.protectSponsor = protectSponsor;
