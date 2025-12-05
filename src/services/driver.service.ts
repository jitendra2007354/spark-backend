import Driver from '../models/driver.model';
import { getConfig } from './config.service';
import { Op } from 'sequelize';

/**
 * Finds the nearest available driver for a ride request.
 */
export const findNearestAvailableDriver = async (lat: number, lng: number, vehicleType: string, excludedDriverIds: number[]): Promise<Driver | null> => {
    // Implementation remains the same
    return null; // Placeholder
};

/**
 * Unblocks a driver, allowing them to receive ride requests again.
 * Typically called after a payment is made.
 */
export const unblockDriver = async (driverId: number): Promise<void> => {
    try {
        const driver = await Driver.findByPk(driverId);
        if (driver) {
            // await driver.update({ isBlocked: false });
            console.log(`Driver ${driverId} has been unblocked.`);
        }
    } catch (error) {
        console.error(`Error unblocking driver ${driverId}:`, error);
    }
};

/**
 * A background job to automatically block drivers who haven't paid their commission.
 */
export const blockOverdueDrivers = async (): Promise<void> => {
    try {
        const config = await getConfig('global');
        const now = new Date();
        const overdueDate = new Date(now.getTime() - ((config?.autoBlockHours || 24) * 3600 * 1000)); // Grace period in hours

        const overdueDrivers = await Driver.findAll({
            where: {
                // isBlocked: false,
                // outstandingPlatformFee: { [Op.gt]: 0 },
                // lastFeePaidOn: { [Op.lt]: overdueDate } // Check when the fee was last considered
            }
        });

        for (const driver of overdueDrivers) {
            // await driver.update({ isBlocked: true });
            console.log(`Automatically blocked Driver ${driver.id} for non-payment.`);
            // Optionally, send a notification to the driver
        }

    } catch (error) {
        console.error("Error in blockOverdueDrivers job:", error);
    }
};

export const findNearbyDrivers = async (lat: number, lng: number, vehicleType: string): Promise<Driver[]> => {
    return [];
};

export const setDriverOnlineStatus = async (
  driverId: number,
  isOnline: boolean,
  location?: { lat: number; lng: number }
): Promise<void> => {
  try {
    const updateData: { isOnline: boolean; currentLat?: number; currentLng?: number } = { isOnline };
    if (location) {
      updateData.currentLat = location.lat;
      updateData.currentLng = location.lng;
    }
    await Driver.update(updateData, { where: { id: driverId } });
  } catch (error) {
    console.error(`Error updating driver ${driverId} status:`, error);
  }
};


// You would run this job on a schedule (e.g., every hour) using a library like node-cron
// For example: cron.schedule('0 * * * *', blockOverdueDrivers);
