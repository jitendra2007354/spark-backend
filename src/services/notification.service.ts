
import User from '../models/user.model';
import { sendMessageToUser } from './websocket.service';
import { Op } from 'sequelize';

// Define the structure for the notification payload
interface NotificationPayload {
    title: string;
    message: string;
}

// Define the possible target groups for the notification
type NotificationTarget = 'all' | 'drivers' | 'customers' | number[];

/**
 * Sends a notification from the admin panel to a specified target group.
 * 
 * @param target - Who the notification is for.
 * @param payload - The content of the notification.
 */
export const sendAdminNotification = async (target: NotificationTarget, payload: NotificationPayload): Promise<void> => {
    console.log(`Attempting to send notification to: ${target}`);

    const whereClause: any = {};

    if (target === 'drivers') {
        whereClause.userType = 'Driver';
    } else if (target === 'customers') {
        whereClause.userType = 'Customer';
    } else if (Array.isArray(target)) {
        whereClause.id = { [Op.in]: target };
    }
    // If target is 'all', the whereClause remains empty, selecting all users.

    try {
        const users = await User.findAll({ where: whereClause, attributes: ['id'] });

        if (users.length === 0) {
            console.log('No users found for the specified target.');
            return;
        }

        // Send the notification to each targeted user via WebSocket
        users.forEach(user => {
            sendMessageToUser(user.id, 'admin_notification', payload);
        });

        console.log(`Successfully sent notification to ${users.length} users.`);

    } catch (error) {
        console.error('Failed to send admin notification:', error);
        // Depending on requirements, you might want to throw the error
        // so the calling API endpoint can return a 500 status.
        throw new Error('Database query for users failed.');
    }
};
