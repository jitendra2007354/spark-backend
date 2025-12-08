import User from '../models/user.model';
import Driver from '../models/driver.model';

/**
 * Applies a penalty to a user's outstanding balance.
 * This works for both Customers (Users) and Drivers.
 * @param userId - The ID of the user to penalize.
 * @param amount - The amount to add to their outstanding balance.
 */
export const applyPenaltyToUser = async (userId: number, amount: number): Promise<void> => {
    try {
        // First, try to find a Driver
        const driver = await Driver.findByPk(userId);

        if (driver) {
            const newBalance = (driver.outstandingPlatformFee || 0) + amount;
            await driver.update({ outstandingPlatformFee: newBalance });
            console.log(`Applied penalty of ${amount} to Driver ${userId}. New balance: ${newBalance}`);
            return;
        }

        // If not a driver, try to find a Customer (User)
        const user = await User.findByPk(userId);

        if (user) {
            const newBalance = (user.outstandingPlatformFee || 0) + amount;
            await user.update({ outstandingPlatformFee: newBalance });
            console.log(`Applied penalty of ${amount} to Customer ${userId}. New balance: ${newBalance}`);
            return;
        }

        console.warn(`Could not find user or driver with ID ${userId} to apply penalty.`);

    } catch (error) {
        console.error(`Error applying penalty to user ${userId}:`, error);
    }
};
