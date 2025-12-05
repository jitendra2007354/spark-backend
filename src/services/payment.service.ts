import Driver from '../models/driver.model';

/**
 * Simulates processing a payment and updates the driver's outstanding balance.
 * In a real app, this would integrate with a payment gateway like Stripe or Razorpay.
 */
export const processMockPayment = async (driverId: number, amount: number): Promise<{ success: boolean, message: string }> => {
    try {
        const driver = await Driver.findByPk(driverId);

        if (!driver) {
            return { success: false, message: "Driver not found." };
        }

        const outstandingFee = driver.outstandingPlatformFee || 0;

        if (outstandingFee < amount) {
            // This could be a feature or a bug, depending on product requirements.
            // For now, we allow overpayment and set the balance to 0.
            console.warn(`Driver ${driverId} paid ${amount}, but only owed ${outstandingFee}.`);
        }

        // Simulate a successful payment transaction
        console.log(`Mock payment of ${amount} for Driver ${driverId} was successful.`);

        // Update the driver's balance
        const newBalance = Math.max(0, outstandingFee - amount);
        await driver.update({ outstandingPlatformFee: newBalance });

        return { success: true, message: "Payment processed successfully." };

    } catch (error) {
        console.error("Mock Payment Service Error:", error);
        return { success: false, message: "An internal error occurred." };
    }
};
