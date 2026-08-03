export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Returns the Cloudinary configuration if environment variables are defined.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

  return {
    cloudName,
    uploadPreset,
  };
}

/**
 * Validates whether Cloudinary upload is configured.
 */
export function isCloudinaryConfigured(): boolean {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  return Boolean(cloudName && uploadPreset);
}

/**
 * Helper to construct direct upload URL for Cloudinary unsigned uploads.
 */
export function getCloudinaryUploadUrl(): string {
  const { cloudName } = getCloudinaryConfig();
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured.');
  }
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}
