import { Request, Response } from 'express';
import { setConfig, getApplicableConfig } from '../services/config.service';

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const config = await setConfig(req.body);
    res.status(200).json(config);
  } catch (error) {
    if (error instanceof Error) {
        res.status(400).json({ error: error.message });
    }
  }
};

export const getConfig = async (req: Request, res: Response) => {
  try {
    const config = await getApplicableConfig();
    res.status(200).json(config);
  } catch (error) {
    if (error instanceof Error) {
        res.status(404).json({ error: error.message });
    }
  }
};
