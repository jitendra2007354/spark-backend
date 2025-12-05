import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  addVehicleForDriver,
  listDriverVehicles,
  setDefaultVehicle,
  deleteVehicle,
} from '../services/vehicle.service';

export const addVehicle = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  try {
    const newVehicle = await addVehicleForDriver(driverId, req.body);
    res.status(201).json(newVehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add vehicle', message: error.message });
  }
};

export const getVehicles = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  try {
    const vehicles = await listDriverVehicles(driverId);
    res.status(200).json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve vehicles', message: error.message });
  }
};

export const setAsDefault = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const { vehicleId } = req.params;
  try {
    const updatedVehicle = await setDefaultVehicle(driverId, parseInt(vehicleId, 10));
    res.status(200).json(updatedVehicle);
  } catch (error: any) {
    res.status(404).json({ error: 'Failed to set default vehicle', message: error.message });
  }
};

export const removeVehicle = async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const { vehicleId } = req.params;
  try {
    await deleteVehicle(driverId, parseInt(vehicleId, 10));
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    res.status(404).json({ error: 'Failed to delete vehicle', message: error.message });
  }
};
