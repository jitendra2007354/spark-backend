import { Router } from 'express';
import multer from 'multer';
import { uploadDocumentController, verifyDocumentController } from '../controllers/document.controller';
import { protect, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

// Route for a driver to upload a document (profile pic, license, or RC)
// The `upload.single('document')` middleware parses the file from the 'document' field in the multipart/form-data
router.post('/upload', [protect, upload.single('document')], uploadDocumentController);

// Route for an admin to verify a driver's document
router.post('/verify', [protect, isAdmin], verifyDocumentController);

export default router;
