import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  addVehicleForDriver,
  listDriverVehicles,
  setDefaultVehicle as setDefaultVehicleService, // Renaming to avoid conflict
  deleteVehicle as deleteVehicleService,     // Renaming to avoid conflict
} from '../services/vehicle.service';

// Handles adding a new vehicle for a driver.
export const addVehicle = async (req: AuthenticatedRequest, res: Response) => {
  // We can safely assume req.user exists because the 'protect' middleware is used.
  const driverId = req.user!.id;
  try {
    const newVehicle = await addVehicleForDriver(driverId, req.body);
    res.status(201).json(newVehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add vehicle', message: error.message });
  }
};

// Handles retrieving all vehicles for the logged-in driver.
export const getVehicles = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  try {
    const vehicles = await listDriverVehicles(driverId);
    res.status(200).json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve vehicles', message: error.message });
  }
};

// This function was the source of a build error because it was not exported with the correct name.
// It is now named correctly and exported.
export const setDefaultVehicle = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const { vehicleId } = req.params;
  try {
    const updatedVehicle = await setDefaultVehicleService(driverId, parseInt(vehicleId, 10));
    res.status(200).json(updatedVehicle);
  } catch (error: any) {
    res.status(404).json({ error: 'Failed to set default vehicle', message: error.message });
  }
};

// This function was also the source of a build error due to an incorrect export name.
// It is now named correctly and exported.
export const deleteVehicle = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const { vehicleId } = req.params;
  try {
    await deleteVehicleService(driverId, parseInt(vehicleId, 10));
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    res.status(404).json({ error: 'Failed to delete vehicle', message: error.message });
  }
};
