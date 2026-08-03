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
    if (isCloudinaryConfigured()) {
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
        const cldError = await cldRes.text();
        console.error('[Cloudinary API Upload Error]', cldError);
        return NextResponse.json(
          { error: 'Failed to upload image to Cloudinary servers. Please try again.' },
          { status: 502 }
        );
      }

      const cldData = await cldRes.json();

      // Rule 1 Verification on Cloudinary Response
      const secureUrl: string = cldData.secure_url || cldData.url || '';
      const resourceType: string = cldData.resource_type || 'image';
      const format: string = (cldData.format || '').toLowerCase();

      // Verify HTTPS URL
      if (!secureUrl.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Upload security check failed: Image URL must use HTTPS.' },
          { status: 400 }
        );
      }

      // Verify Cloudinary Domain
      if (!secureUrl.includes('res.cloudinary.com')) {
        return NextResponse.json(
          { error: 'Upload verification failed: Invalid Cloudinary domain.' },
          { status: 400 }
        );
      }

      // Verify Resource Type == "image"
      if (resourceType !== 'image') {
        return NextResponse.json(
          { error: 'Upload security check failed: Only image uploads are allowed.' },
          { status: 400 }
        );
      }

      // Verify Format
      const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
      if (format && !allowedFormats.includes(format)) {
        return NextResponse.json(
          { error: `Upload security check failed: Invalid format '${format}'. Allowed: JPG, PNG, WEBP.` },
          { status: 400 }
        );
      }

      // Return verified payload with Rule 11 Cloudinary Metadata
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

    // Fallback mode for local dev/testing if Cloudinary environment keys are not configured
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const fallbackUrl = `data:${mimeType};base64,${base64}`;
    const fallbackPublicId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      url: fallbackUrl,
      publicId: fallbackPublicId,
      metadata: {
        public_id: fallbackPublicId,
        asset_id: `asset_${fallbackPublicId}`,
        version: 1,
        bytes: file.size,
        width: 800,
        height: 600,
        format: mimeType.replace('image/', ''),
        resource_type: 'image',
        secure_url: fallbackUrl,
        created_at: new Date().toISOString(),
      },
      warning: 'Cloudinary environment variables not set. Using secure base64 fallback for testing.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Upload failed due to unknown server error.';
    console.error('[Upload API Internal Error]', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
