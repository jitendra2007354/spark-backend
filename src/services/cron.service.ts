
import cron from 'node-cron';
import { Op } from 'sequelize';
import ChatMessage from '../models/chat.model'; // Corrected from Chat to ChatMessage
import Ride from '../models/ride.model';
import User from '../models/user.model';
import { getApplicableConfig } from './config.service';

/**
 * Schedules a cron job to delete old chat messages from completed rides.
 * The job runs once every day at midnight.
 */
export const scheduleChatCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled job: Deleting old chat messages...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const oldRides = await Ride.findAll({
        where: {
          status: 'completed',
          updatedAt: { [Op.lt]: twentyFourHoursAgo },
        },
        attributes: ['id'],
      });

      if (oldRides.length === 0) {
        console.log('No old rides found. Chat cleanup not needed.');
        return;
      }

      const rideIds = oldRides.map(ride => ride.id);

      const result = await ChatMessage.destroy({
        where: {
          rideId: { [Op.in]: rideIds },
        },
      });

      console.log(`Successfully deleted ${result} chat messages from ${rideIds.length} old rides.`);
    } catch (error) {
      console.error('Error during chat cleanup cron job:', error);
    }
  });

  console.log('✅ Scheduled daily chat cleanup job.');
};

/**
 * Schedules a cron job to block drivers with long-overdue payments.
 * The job runs once every hour.
 */
export const scheduleDriverStatusChecks = () => {
  cron.schedule('0 * * * *', async () => { 
    console.log('Running scheduled job: Checking for drivers with outstanding balances...');
    try {
      const config = await getApplicableConfig(); 
      const autoBlockHours = config.autoBlockHours || 72; 

      const blockThresholdDate = new Date(Date.now() - autoBlockHours * 60 * 60 * 1000);

      const [updateCount] = await User.update(
        { isBlocked: true }, 
        {
          where: {
            userType: 'Driver',
            isBlocked: false, 
            outstandingPlatformFee: { [Op.gt]: 0 }, // Corrected field name
            lowBalanceSince: { // Using the correct field to check duration
              [Op.ne]: null,
              [Op.lt]: blockThresholdDate, 
            },
          },
        }
      );

      if (updateCount > 0) {
        console.log(`Successfully auto-blocked ${updateCount} drivers for non-payment.`);
      }
    } catch (error) {
      console.error('Error during driver status check cron job:', error);
    }
  });

  console.log('✅ Scheduled hourly driver status check job.');
};
