import { Op } from 'sequelize';
import Notification, { NotificationType } from '../models/notification.model';
import User from '../models/user.model';

/**
 * Sends a notification to a specific user.
 * @param userId The ID of the user to notify.
 * @param title The title of the notification.
 * @param message The message content.
 */
export const sendNotificationToUser = async (userId: number, title: string, message: string) => {
  const notification = await Notification.create({ userId, title, message, type: 'general' as NotificationType });
  // In a real app, you would use a push notification service (like Firebase Cloud Messaging)
  console.log(`LOG: Notification sent to user ${userId}: ${title}`);
  return notification;
};

/**
 * Sends a notification to all users of a certain type (customers or drivers).
 * @param userType The type of users to notify ('Customer' | 'Driver').
 * @param title The title of the notification.
 * @param message The message content.
 */
export const sendNotificationToUserGroup = async (userType: 'Customer' | 'Driver', title: string, message: string) => {
  const users = await User.findAll({ where: { userType } });
  const notifications = users.map(user => ({ userId: user.id, title, message, type: 'general' as NotificationType }));
  await Notification.bulkCreate(notifications);
  console.log(`LOG: Sent notification to all ${userType}s: ${title}`);
};

/**
 * Sends a notification to all users.
 * @param title The title of the notification.
 * @param message The message content.
 */
export const sendNotificationToAll = async (title: string, message: string) => {
    const users = await User.findAll();
    const notifications = users.map(user => ({ userId: user.id, title, message, type: 'general' as NotificationType }));
    await Notification.bulkCreate(notifications);
    console.log(`LOG: Sent notification to all users: ${title}`);
};
