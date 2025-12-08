
import User from '../models/user.model';
import { getConfig } from './config.service';
import { Op, Sequelize } from 'sequelize';
import { sendMessageToUser } from './websocket.service';

/**
 * Finds the nearest available and verified driver for a ride request.
 */
export const findNearestAvailableDriver = async (lat: number, lng: number, vehicleType: string, excludedDriverIds: number[]): Promise<User | null> => {
    const config = await getConfig('global'); 
    const radius = config?.driverSearchRadius || 5; // Search radius in kilometers

    const drivers = await User.findAll({
        where: {
            userType: 'Driver',
            isOnline: true,
            isBlocked: false,
            licenseIsVerified: true, // Ensure driver is verified
            rcIsVerified: true,
            id: { [Op.notIn]: excludedDriverIds },
            // A basic bounding box query for location
            currentLat: {
                [Op.between]: [lat - (radius / 111), lat + (radius / 111)],
            },
            currentLng: {
                [Op.between]: [lng - (radius / (111 * Math.cos(lat * (Math.PI / 180)))), lng + (radius / (111 * Math.cos(lat * (Math.PI / 180))))],
            },
        },
        attributes: {
            include: [
                // Calculate distance using Haversine formula
                [Sequelize.literal(`6371 * acos(cos(radians(${lat})) * cos(radians(currentLat)) * cos(radians(currentLng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(currentLat)))`), 'distance'],
            ],
        },
        order: Sequelize.col('distance'),
        limit: 1,
    });

    return drivers.length > 0 ? drivers[0] : null;
};

/**
 * Blocks a driver, preventing them from receiving ride requests.
 * CORRECTED: This function now accepts a userId.
 */
export const blockDriver = async (userId: number): Promise<void> => {
    try {
        const user = await User.findByPk(userId);
        if (user && user.userType === 'Driver') {
            await user.update({ isBlocked: true });
            sendMessageToUser(userId, 'account_blocked', { reason: 'Your account has been blocked by an administrator.' });
            console.log(`Driver associated with user ${userId} has been blocked.`);
        }
    } catch (error) {
        console.error(`Error blocking driver for user ${userId}:`, error);
    }
};

/**
 * Unblocks a driver, allowing them to receive ride requests again.
 * CORRECTED: This function now accepts a userId instead of a driverId.
 */
export const unblockDriver = async (userId: number): Promise<void> => {
    try {
        const user = await User.findByPk(userId);
        if (user && user.userType === 'Driver') {
            await user.update({ isBlocked: false, lowBalanceSince: null });
            sendMessageToUser(userId, 'account_unblocked', { reason: 'Your account has been reinstated.' });
            console.log(`Driver associated with user ${userId} has been unblocked.`);
        }
    } catch (error) {
        console.error(`Error unblocking driver for user ${userId}:`, error);
    }
};

/**
 * A background job to automatically block drivers who have a low wallet balance for too long.
 */
export const blockOverdueDrivers = async (): Promise<void> => {
    try {
        const config = await getConfig('global');
        const now = new Date();
        const gracePeriodHours = config?.autoBlockHours || 24;
        const thresholdDate = new Date(now.getTime() - (gracePeriodHours * 3600 * 1000));

        const overdueDrivers = await User.findAll({
            where: {
                userType: 'Driver',
                isBlocked: false,
                walletBalance: { [Op.lt]: config?.walletMinBalance || 0 }, // Below min balance
                lowBalanceSince: { [Op.lt]: thresholdDate } // For longer than the grace period
            }
        });

        for (const driver of overdueDrivers) {
            await driver.update({ isBlocked: true });
            console.log(`Automatically blocked Driver ${driver.id} for low balance.`);
            sendMessageToUser(driver.id, 'account_blocked', { reason: 'Low wallet balance.' });
        }

    } catch (error) {
        console.error("Error in blockOverdueDrivers job:", error);
    }
};

/**
 * Finds all available drivers within a certain radius.
 */
export const findNearbyDrivers = async (lat: number, lng: number, vehicleType: string): Promise<User[]> => {
    const config = await getConfig('global');
    const radius = config?.driverSearchRadius || 5; // Search radius in kilometers

    const drivers = await User.findAll({
        where: {
            userType: 'Driver',
            isOnline: true,
            isBlocked: false,
            // Basic bounding box for location
            currentLat: {
                [Op.between]: [lat - (radius / 111), lat + (radius / 111)],
            },
            currentLng: {
                [Op.between]: [lng - (radius / (111 * Math.cos(lat * (Math.PI / 180)))), lng + (radius / (111 * Math.cos(lat * (Math.PI / 180))))],
            },
        },
    });

    return drivers;
};

/**
 * Updates a driver's online status and location.
 */
export const setDriverOnlineStatus = async (
  driverId: number,
  isOnline: boolean,
  location?: { lat: number; lng: number }
): Promise<void> => {
  try {
    const driver = await User.findByPk(driverId);
    if (driver && driver.userType === 'Driver') {
        const updateData: any = { isOnline };
        if (location) {
            updateData.currentLat = location.lat;
            updateData.currentLng = location.lng;
        }
        await driver.update(updateData);
    }
  } catch (error) {
    console.error(`Error updating driver ${driverId} status:`, error);
  }
};
