import DriverLocation from '../models/driver-location.model';
import User from '../models/user.model'; // Assuming User model exists and can be a driver

/**
 * Updates or creates a driver's location in the database.
 * This operation is an 'upsert': it updates the record if the driverId exists, otherwise it creates a new one.
 * @param driverId The ID of the driver.
 * @param lat The latitude of the driver's location.
 * @param lng The longitude of the driver's location.
 */
export const updateDriverLocation = async (driverId: number, lat: number, lng: number): Promise<void> => {
  try {
    await DriverLocation.upsert({
      driverId,
      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    console.error(`ERROR: Failed to update location for driver ${driverId}:`, error);
  }
};

/**
 * Retrieves the latest known locations of all drivers.
 * This is useful for populating the map when a user first opens the app.
 * @returns A list of all driver locations.
 */
export const getAllDriverLocations = async (): Promise<DriverLocation[]> => {
  try {
    return await DriverLocation.findAll();
  } catch (error) {
    console.error('ERROR: Failed to retrieve all driver locations:', error);
    return [];
  }
};

/**
 * Deletes a driver's location from the database.
 * This should be called when a driver goes offline.
 * @param driverId The ID of the driver.
 */
export const removeDriverLocation = async (driverId: number): Promise<void> => {
    try {
        const record = await DriverLocation.findOne({ where: { driverId } });
        if (record) {
            await record.destroy();
        }
    } catch (error) {
        console.error(`ERROR: Failed to remove location for driver ${driverId}:`, error);
    }
};