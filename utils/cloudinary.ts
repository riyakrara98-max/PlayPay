import { CloudinaryMetadata } from '@/types/firestore';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Returns the Cloudinary configuration if environment variables are defined.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    'aubq8fhy';
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    'playpay';

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

/**
 * Strictly verifies that a URL is a valid Cloudinary HTTPS URL.
 * Rejects non-Cloudinary, data:, blob:, file:, and localhost URLs.
 */
export function isCloudinarySecureUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Strict check: must start with https://res.cloudinary.com/
  if (!trimmed.startsWith('https://res.cloudinary.com/')) {
    return false;
  }

  // Reject pseudo URLs
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('file:') ||
    trimmed.includes('localhost')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes Cloudinary metadata against security requirements.
 */
export function validateCloudinaryMetadata(
  metadata: unknown,
  expectedSecureUrl?: string
): CloudinaryMetadata | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const meta = metadata as Partial<CloudinaryMetadata>;

  if (typeof meta.public_id !== 'string' || !meta.public_id.trim()) {
    return null;
  }
  if (typeof meta.secure_url !== 'string' || !isCloudinarySecureUrl(meta.secure_url)) {
    return null;
  }
  if (expectedSecureUrl && meta.secure_url.trim() !== expectedSecureUrl.trim()) {
    return null;
  }

  return {
    public_id: meta.public_id.trim(),
    secure_url: meta.secure_url.trim(),
    width: typeof meta.width === 'number' ? meta.width : undefined,
    height: typeof meta.height === 'number' ? meta.height : undefined,
    format: typeof meta.format === 'string' ? meta.format : undefined,
    bytes: typeof meta.bytes === 'number' ? meta.bytes : undefined,
    resource_type: typeof meta.resource_type === 'string' ? meta.resource_type : undefined,
    created_at: typeof meta.created_at === 'string' ? meta.created_at : undefined,
  };
}
