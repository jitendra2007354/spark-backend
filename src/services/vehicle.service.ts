import User from '../models/user.model';
import Vehicle, { VehicleType } from '../models/vehicle.model';

interface VehicleData {
  vehicleNumber: string;
  vehicleModel: string;
  vehicleType: VehicleType;
  rcPhotoUrl: string;
  licensePhotoUrl: string;
}

/**
 * Adds a new vehicle for a driver.
 */
export const addVehicleForDriver = async (driverId: number, vehicleData: VehicleData) => {
  const driver = await User.findByPk(driverId);
  if (!driver || driver.userType !== 'Driver') {
    throw new Error('Driver not found');
  }

  const newVehicle = await Vehicle.create({
    userId: driverId,
    ...vehicleData,
    isDefault: false,
  });

  return newVehicle;
};

/**
 * Lists all vehicles for a specific driver.
 * CORRECTED: This function now filters out soft-deleted vehicles.
 */
export const listDriverVehicles = async (driverId: number) => {
  return await Vehicle.findAll({ where: { userId: driverId, isDeleted: false } });
};

/**
 * Sets a vehicle as the default for a driver.
 */
export const setDefaultVehicle = async (driverId: number, vehicleId: number) => {
  // First, unset any other default vehicle for this driver
  await Vehicle.update({ isDefault: false }, { where: { userId: driverId } });

  // Then, set the new default vehicle, ensuring it is not deleted
  const [updateCount] = await Vehicle.update({ isDefault: true }, { where: { id: vehicleId, userId: driverId, isDeleted: false } });

  if (updateCount === 0) {
    throw new Error('Vehicle not found or does not belong to this driver.');
  }

  return await Vehicle.findByPk(vehicleId);
};

/**
 * Deletes a vehicle for a driver by marking it as deleted (soft delete).
 * CORRECTED: This function now performs a soft delete instead of a hard delete.
 */
export const deleteVehicle = async (driverId: number, vehicleId: number) => {
  // We use update to set an 'isDeleted' flag instead of destroying the record
  const [updateCount] = await Vehicle.update({ isDeleted: true }, { where: { id: vehicleId, userId: driverId } });

  if (updateCount === 0) {
    throw new Error('Vehicle not found or does not belong to this driver.');
  }

  return { message: 'Vehicle deleted successfully' };
};
