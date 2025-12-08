import { Request, Response } from 'express';
import { uploadDocument, verifyDocument } from '../services/document.service';

/**
 * Controller to handle document uploads.
 * Assumes middleware (like multer) has processed the file and attached it to the request.
 */
export const uploadDocumentController = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { documentType } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  if (!['driverPic', 'license', 'rc'].includes(documentType)) {
    return res.status(400).json({ message: 'Invalid documentType.' });
  }

  try {
    const result = await uploadDocument(userId, documentType, req.file.originalname);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to upload document.', error: error.message });
  }
};

/**
 * Controller for an admin to verify a document.
 */
export const verifyDocumentController = async (req: Request, res: Response) => {
  const { driverId, documentType } = req.body;

  try {
    if (!driverId || !documentType) {
        return res.status(400).json({ message: 'driverId and documentType are required.' });
    }
    const result = await verifyDocument(driverId, documentType);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to verify document.', error: error.message });
  }
};
