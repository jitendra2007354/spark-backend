import cron from 'node-cron';
import { Op } from 'sequelize';
import User from '../models/user.model';

const MINIMUM_BALANCE = 500; // Minimum required balance in the wallet
const GRACE_PERIOD_HOURS = 72; // 3 days grace period

/**
 * Schedules a cron job to check for drivers with low wallet balances.
 * Runs every hour.
 */
export const scheduleWalletCheck = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running hourly job: Checking driver wallet balances...');

    try {
      // 1. Find drivers with balance below the minimum
      const lowBalanceDrivers = await User.findAll({
        where: {
          userType: 'Driver',
          walletBalance: {
            [Op.lt]: MINIMUM_BALANCE,
          },
          isBlocked: false,
        },
      });

      const now = new Date();
      for (const driver of lowBalanceDrivers) {
        if (driver.lowBalanceSince) {
          // 2. If the grace period has expired, block the driver
          const gracePeriodEnd = new Date(driver.lowBalanceSince.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000);
          if (now > gracePeriodEnd) {
            driver.isBlocked = true;
            await driver.save();
            console.log(`Driver ${driver.id} has been blocked due to prolonged low balance.`);
            // TODO: Send a notification to the driver
          }
        } else {
          // 3. If this is the first time the balance is low, set the timestamp
          driver.lowBalanceSince = now;
          await driver.save();
          console.log(`Driver ${driver.id} has a low balance. Grace period started.`);
          // TODO: Send a warning notification to the driver
        }
      }

      // 4. Reset the flag for drivers who have recharged their wallet
      await User.update(
        { lowBalanceSince: null },
        {
          where: {
            userType: 'Driver',
            walletBalance: {
              [Op.gte]: MINIMUM_BALANCE,
            },
            lowBalanceSince: {
              [Op.ne]: null, // Only update if the flag was previously set
            },
          },
        }
      );

    } catch (error) {
      console.error('Error during wallet balance check cron job:', error);
    }
  });

  console.log('✅ Scheduled hourly driver wallet balance check.');
};
