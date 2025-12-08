import Config, { ConfigAttributes, ConfigCreationAttributes } from '../models/config.model';
import { VehicleType } from '../models/vehicle.model';

const DEFAULT_CONFIG_KEY = 'global';

// In-memory cache for configs
const configCache = new Map<string, ConfigAttributes>();

/**
 * Fetches a configuration from the database by its key.
 */
const getConfigFromDb = async (key: string): Promise<ConfigAttributes | null> => {
  const config = await Config.findOne({ where: { key } });
  return config ? config.get({ plain: true }) : null;
};

/**
 * Retrieves a configuration from cache or fetches it from the database.
 */
export const getConfig = async (key: string): Promise<ConfigAttributes | null> => {
  if (configCache.has(key)) {
    return configCache.get(key)!;
  }
  const config = await getConfigFromDb(key);
  if (config) {
    configCache.set(key, config);
  }
  return config;
};

/**
 * Finds the most specific configuration that applies to a given context.
 * The hierarchy is: City+Vehicle -> Vehicle -> City -> Global
 */
export const getApplicableConfig = async (
  city?: string,
  vehicleType?: VehicleType
): Promise<ConfigAttributes> => {
  let config: ConfigAttributes | null = null;

  // 1. Try City + Vehicle Type
  if (city && vehicleType) {
    config = await getConfig(`city:${city}|vehicle:${vehicleType}`);
    if (config) return config;
  }

  // 2. Try Vehicle Type only
  if (vehicleType) {
    config = await getConfig(`vehicle:${vehicleType}`);
    if (config) return config;
  }

  // 3. Try City only
  if (city) {
    config = await getConfig(`city:${city}`);
    if (config) return config;
  }

  // 4. Fallback to global default
  config = await getConfig(DEFAULT_CONFIG_KEY);
  if (!config) {
    throw new Error('Critical: Default configuration is not set in the database.');
  }

  return config;
};

/**
 * Creates or updates a configuration in the database.
 */
export const setConfig = async (configData: Partial<ConfigAttributes>): Promise<ConfigAttributes> => {
  const { key, ...otherData } = configData;
  if (!key) {
    throw new Error('Configuration key must be provided.');
  }

  let config = await Config.findOne({ where: { key } });
  if (config) {
    config = await config.update(otherData);
  } else {
    config = await Config.create({ key, ...otherData } as ConfigCreationAttributes);
  }

  // Update cache
  const plainConfig = config.get({ plain: true });
  configCache.set(key, plainConfig);

  return plainConfig;
};
