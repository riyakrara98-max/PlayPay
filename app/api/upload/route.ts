import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryConfig, isCloudinaryConfigured, getCloudinaryUploadUrl } from '@/utils/cloudinary';

export const maxDuration = 60; // 60 seconds

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    // 1. File Size Validation (Max 10 MB = 10,485,760 bytes)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum limit of 10 MB.` },
        { status: 400 }
      );
    }

    // 2. Format / Mime-Type Validation
    const mimeType = file.type.toLowerCase();
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = /\.(jpg|jpeg|png|webp)$/i.test(fileName);

    if (!allowedMimeTypes.includes(mimeType) || !hasValidExtension) {
      return NextResponse.json(
        { error: 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.' },
        { status: 400 }
      );
    }

    // 3. Cloudinary Upload Execution
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Cloudinary upload is not configured. CloudName and UploadPreset are required.' },
        { status: 400 }
      );
    }

    try {
      const { uploadPreset } = getCloudinaryConfig();
      const uploadUrl = getCloudinaryUploadUrl();

      const cldFormData = new FormData();
      cldFormData.append('file', file);
      cldFormData.append('upload_preset', uploadPreset);

      const cldRes = await fetch(uploadUrl, {
        method: 'POST',
        body: cldFormData,
      });

      if (!cldRes.ok) {
        const cldErrorText = await cldRes.text();
        console.error('[Cloudinary API Upload Error]', cldErrorText);
        return NextResponse.json(
          { error: 'Cloudinary upload failed. Please verify your upload preset and cloud name.' },
          { status: 400 }
        );
      }

      const cldData = await cldRes.json();
      const secureUrl: string = cldData.secure_url || cldData.url || '';
      const resourceType: string = cldData.resource_type || 'image';
      const format: string = (cldData.format || '').toLowerCase();

      // Verify HTTPS URL & Cloudinary Domain & Resource Type
      if (
        secureUrl.startsWith('https://') &&
        secureUrl.includes('res.cloudinary.com') &&
        resourceType === 'image'
      ) {
        return NextResponse.json({
          url: secureUrl,
          publicId: cldData.public_id,
          metadata: {
            public_id: cldData.public_id || '',
            asset_id: cldData.asset_id || '',
            version: cldData.version || 1,
            bytes: cldData.bytes || file.size,
            width: cldData.width || 0,
            height: cldData.height || 0,
            format: format || mimeType.replace('image/', ''),
            resource_type: resourceType,
            secure_url: secureUrl,
            created_at: cldData.created_at || new Date().toISOString(),
          },
        });
      }

      return NextResponse.json(
        { error: 'Cloudinary upload verification failed: Response did not contain a valid HTTPS Cloudinary URL.' },
        { status: 400 }
      );
    } catch (cldErr) {
      console.error('[Cloudinary Exception]', cldErr);
      return NextResponse.json(
        { error: 'Cloudinary upload request failed due to a network error.' },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Upload failed due to unknown server error.';
    console.error('[Upload API Internal Error]', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
