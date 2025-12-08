import User from '../models/user.model';
import { getApplicableConfig } from './config.service';
import sequelize from '../services/database.service'; // Fixed import
import { Op, Transaction } from 'sequelize'; // Import Transaction

/**
 * Adds or removes funds from a driver's wallet.
 * Sets a timestamp if the balance falls below the minimum.
 */
export const updateUserWallet = async (driverId: number, amount: number) => {
  return await sequelize.transaction(async (t: Transaction) => { // Typed 't'
    const driver = await User.findByPk(driverId, { transaction: t, lock: true });

    if (!driver || driver.userType !== 'Driver') {
      throw new Error('Driver not found.');
    }

    const newBalance = driver.walletBalance + amount;
    const config = await getApplicableConfig(driver.city || undefined, undefined);
    const minBalance = config.walletMinBalance; // Corrected property name

    driver.walletBalance = newBalance;

    if (newBalance < minBalance) {
      if (!driver.lowBalanceSince) {
        // Set the timestamp only when the balance first drops low
        driver.lowBalanceSince = new Date();
      }
    } else {
      // If balance is healthy, clear the timestamp and unblock the user
      driver.lowBalanceSince = null;
      driver.isBlocked = false;
    }

    await driver.save({ transaction: t });

    console.log(`LOG: Updated wallet for driver ${driverId}. New Balance: ${newBalance}`);
    return driver;
  });
};

/**
 * Background job to check for and block drivers with prolonged low balances.
 */
export const checkAndBlockDriversWithLowBalance = async () => {
  console.log('LOG: Running job to check for drivers with low balance...');
  const globalConfig = await getApplicableConfig(undefined, undefined);
  // Assuming a new property `driverBlockingPeriodHours` is added to Config model
  // or a default value is used if not present or directly define it here
  // For now, I'll use a hardcoded value, or you can add it to your Config model and retrieve it.
  const blockingPeriodHours = 24; // Example: block after 24 hours of low balance

  const blockThreshold = new Date();
  blockThreshold.setHours(blockThreshold.getHours() - blockingPeriodHours);

  const driversToBlock = await User.findAll({
    where: {
      userType: 'Driver',
      isBlocked: false,
      lowBalanceSince: { [Op.ne]: null, [Op.lt]: blockThreshold },
    },
  });

  if (driversToBlock.length === 0) {
    console.log('LOG: No drivers to block for low balance.');
    return;
  }

  for (const driver of driversToBlock) {
    driver.isBlocked = true;
    await driver.save();
    console.log(`LOG: Auto-blocked driver ${driver.id} due to prolonged low wallet balance.`);
    // Here you could also send a notification to the driver
  }
};

/**
 * Retrieves a driver's wallet balance.
 */
export const getDriverWalletBalance = async (driverId: number): Promise<number> => {
  const driver = await User.findByPk(driverId);
  if (!driver || driver.userType !== 'Driver') throw new Error('Driver not found.');
  return driver.walletBalance;
};

/**
 * Allows a driver to top up their wallet.
 */
export const topUpWallet = async (driverId: number, amount: number) => {
  if (amount <= 0) throw new Error('Top-up amount must be positive.');
  return await updateUserWallet(driverId, amount);
};