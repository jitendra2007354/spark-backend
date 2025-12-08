
import DriverLocation from '../models/driver-location.model';
import sequelize from '../services/database.service'; // Corrected import
import { Op } from 'sequelize';
import Driver from '../models/driver.model';
import Ride from '../models/ride.model';
import { VehicleType } from '../models/vehicle.model';
import { getApplicableConfig } from './config.service';
import { sendMessageToAdminRoom, sendMessageToUser } from './websocket.service';

/**
 * Creates or updates a driver's location and broadcasts it to admins and relevant customers.
 */
export const updateDriverLocation = async (driverId: number, lat: number, lng: number): Promise<void> => {
    await DriverLocation.upsert({
        driverId,
        location: { type: 'Point', coordinates: [lng, lat] },
    });

    const newLocation = { driverId, location: { lat, lng } };

    // 1. Stream the new location to the admin room
    sendMessageToAdminRoom('driver_location_updated', newLocation);

    // 2. Find the driver's active ride
    const activeRide = await Ride.findOne({
        where: {
            driverId,
            status: { [Op.in]: ['accepted', 'confirmed', 'enroute', 'arrived'] }
        }
    });

    // 3. If there is an active ride, send the location to the customer
    if (activeRide) {
        sendMessageToUser(activeRide.customerId, 'driver_location_updated', newLocation);
    }
};

/**
 * Removes a driver's location from the database.
 */
export const removeDriverLocation = async (driverId: number): Promise<void> => {
    await DriverLocation.destroy({ where: { driverId } });
};

/**
 * Finds the single nearest available driver using a geospatial query.
 */
export const findNearestAvailableDriver = async (
    lat: number,
    lng: number,
    vehicleType: VehicleType,
    excludedDriverIds: number[] = []
): Promise<Driver | null> => {
    const userLocation = sequelize.literal(`ST_GeomFromText('POINT(${lng} ${lat})')`);
    const location = await DriverLocation.findOne({
        include: [{
            model: Driver,
            as: 'driver',
            required: true,
            where: {
                isAvailable: true,
                vehicleType: vehicleType,
                id: { [Op.notIn]: excludedDriverIds }
            }
        }],
        order: sequelize.literal(`ST_Distance_Sphere(location, ${userLocation})`),
    });

    return location ? (location as any).driver : null;
};

/**
 * Finds ALL nearby available drivers for bidding.
 */
export const findNearbyAvailableDrivers = async (
    lat: number,
    lng: number,
    vehicleType: VehicleType,
    city?: string
): Promise<Driver[]> => {
    const config = await getApplicableConfig(city);
    const searchRadius = (config.driverSearchRadius || 5) * 1000; // Radius in meters
    const userLocation = sequelize.literal(`ST_GeomFromText('POINT(${lng} ${lat})')`);
    const locations = await DriverLocation.findAll({
        where: sequelize.where(
            sequelize.fn('ST_Distance_Sphere', sequelize.col('location'), userLocation),
            { [Op.lte]: searchRadius }
        ),
        include: [{
            model: Driver,
            as: 'driver',
            required: true,
            where: { isAvailable: true, vehicleType: vehicleType }
        }]
    });
    return locations.map(location => (location as any).driver);
};

/**
 * Retrieves the current location of all online drivers.
 * Used to populate the admin's live map on initial load.
 */
export const getAllOnlineDriverLocations = async (): Promise<any[]> => {
    const locations = await DriverLocation.findAll({
        include: [{
            model: Driver,
            as: 'driver',
            required: true,
            attributes: ['id', 'name', 'vehicleType']
        }],
        attributes: [
            'driverId',
            [sequelize.fn('ST_X', sequelize.col('location')), 'lng'],
            [sequelize.fn('ST_Y', sequelize.col('location')), 'lat']
        ],
        raw: true
    });
    return locations;
};
