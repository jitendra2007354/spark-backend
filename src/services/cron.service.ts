import cron from 'node-cron';
import { Op } from 'sequelize';
import Chat from '../models/chat.model';

/**
 * Schedules a cron job to delete old chat messages.
 * The job runs once every day at midnight.
 */
export const scheduleChatCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled job: Deleting old chat messages...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const result = await Chat.destroy({
        where: {
          createdAt: { // This was already changed to createdAt
            [Op.lt]: twentyFourHoursAgo,
          },
        },
      });
      console.log(`Successfully deleted ${result} old chat threads.`);
    } catch (error) {
      console.error('Error during chat cleanup cron job:', error);
    }
  });

  console.log('✅ Scheduled daily chat cleanup job.');
};