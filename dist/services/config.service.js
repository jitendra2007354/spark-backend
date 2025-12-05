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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfig = exports.getApplicableConfig = exports.getConfig = void 0;
const config_model_1 = __importDefault(require("../models/config.model"));
const DEFAULT_CONFIG_KEY = 'global';
// In-memory cache for configs
const configCache = new Map();
/**
 * Fetches a configuration from the database by its key.
 */
const getConfigFromDb = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield config_model_1.default.findOne({ where: { key } });
    return config ? config.get({ plain: true }) : null;
});
/**
 * Retrieves a configuration from cache or fetches it from the database.
 */
const getConfig = (key) => __awaiter(void 0, void 0, void 0, function* () {
    if (configCache.has(key)) {
        return configCache.get(key);
    }
    const config = yield getConfigFromDb(key);
    if (config) {
        configCache.set(key, config);
    }
    return config;
});
exports.getConfig = getConfig;
/**
 * Finds the most specific configuration that applies to a given context.
 * The hierarchy is: City+Vehicle -> Vehicle -> City -> Global
 */
const getApplicableConfig = (city, vehicleType) => __awaiter(void 0, void 0, void 0, function* () {
    let config = null;
    // 1. Try City + Vehicle Type
    if (city && vehicleType) {
        config = yield (0, exports.getConfig)(`city:${city}|vehicle:${vehicleType}`);
        if (config)
            return config;
    }
    // 2. Try Vehicle Type only
    if (vehicleType) {
        config = yield (0, exports.getConfig)(`vehicle:${vehicleType}`);
        if (config)
            return config;
    }
    // 3. Try City only
    if (city) {
        config = yield (0, exports.getConfig)(`city:${city}`);
        if (config)
            return config;
    }
    // 4. Fallback to global default
    config = yield (0, exports.getConfig)(DEFAULT_CONFIG_KEY);
    if (!config) {
        throw new Error('Critical: Default configuration is not set in the database.');
    }
    return config;
});
exports.getApplicableConfig = getApplicableConfig;
/**
 * Creates or updates a configuration in the database.
 */
const setConfig = (configData) => __awaiter(void 0, void 0, void 0, function* () {
    const { key } = configData, otherData = __rest(configData, ["key"]);
    if (!key) {
        throw new Error('Configuration key must be provided.');
    }
    let config = yield config_model_1.default.findOne({ where: { key } });
    if (config) {
        config = yield config.update(otherData);
    }
    else {
        config = yield config_model_1.default.create(Object.assign({ key }, otherData));
    }
    // Update cache
    const plainConfig = config.get({ plain: true });
    configCache.set(key, plainConfig);
    return plainConfig;
});
exports.setConfig = setConfig;
