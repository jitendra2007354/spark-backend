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
exports.getConfig = exports.updateConfig = void 0;
const config_service_1 = require("../services/config.service");
const updateConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_service_1.setConfig)(req.body);
        res.status(200).json(config);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
    }
});
exports.updateConfig = updateConfig;
const getConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_service_1.getApplicableConfig)();
        res.status(200).json(config);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ error: error.message });
        }
    }
});
exports.getConfig = getConfig;
