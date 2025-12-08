import User from '../models/user.model';

export type DocumentType = 'driverPic' | 'license' | 'rc';

/**
 * Mocks uploading a document and returns a URL.
 * In a real application, this would handle file uploads to a cloud storage provider (e.g., S3).
 * @param userId The ID of the user uploading the document.
 * @param documentType The type of document being uploaded.
 * @param file The file to upload (in a real scenario).
 * @returns The public URL of the uploaded document.
 */
export const uploadDocument = async (userId: number, documentType: DocumentType, fileName: string) => {
  const user = await User.findByPk(userId);
  if (!user || user.userType !== 'Driver') {
    throw new Error('Driver not found.');
  }

  // In a real implementation, you would upload the file to S3, Google Cloud Storage, etc.
  // and get a URL back. Here, we'll just construct a mock URL.
  const mockFileUrl = `https://your-storage-provider.com/documents/${userId}/${documentType}-${fileName}`;

  // Save the URL to the user's record
  switch (documentType) {
    case 'driverPic':
      user.driverPicUrl = mockFileUrl;
      break;
    case 'license':
      user.licenseUrl = mockFileUrl;
      break;
    case 'rc':
      user.rcUrl = mockFileUrl;
      break;
    default:
      throw new Error('Invalid document type.');
  }

  await user.save();

  return { message: `${documentType} uploaded successfully.`, url: mockFileUrl };
};

/**
 * (Admin only) Verifies a document by marking its corresponding flag in the User model.
 * @param driverId The ID of the driver whose document is being verified.
 * @param documentType The type of document to verify.
 */
export const verifyDocument = async (driverId: number, documentType: DocumentType) => {
    const driver = await User.findByPk(driverId);
    if (!driver || driver.userType !== 'Driver') {
        throw new Error('Driver not found.');
    }

    switch (documentType) {
        case 'driverPic':
            driver.driverPicIsVerified = true;
            break;
        case 'license':
            driver.licenseIsVerified = true;
            break;
        case 'rc':
            driver.rcIsVerified = true;
            break;
        default:
            throw new Error('Invalid document type for verification.');
    }

    await driver.save();

    return { message: `Document '${documentType}' for driver ${driverId} has been successfully verified.` };
};
