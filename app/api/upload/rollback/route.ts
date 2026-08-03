import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryConfig } from '@/utils/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { publicId } = await req.json();

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json({ error: 'Valid publicId required for rollback.' }, { status: 400 });
    }

    if (publicId.startsWith('fallback_')) {
      // Local fallback asset, nothing to delete on Cloudinary
      return NextResponse.json({ success: true, message: 'Fallback asset discarded locally.' });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('[Cloudinary Rollback Warning] Missing Cloudinary admin API credentials. Cannot destroy remote asset:', publicId);
      return NextResponse.json({
        success: true,
        warning: 'Rollback requested, but Cloudinary API keys are not present on server.',
      });
    }

    // Call Cloudinary Admin Destroy API if server keys are present
    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = await import('crypto');
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const res = await fetch(destroyUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('[Cloudinary Asset Destroyed]', publicId, data);

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Rollback failed.';
    console.error('[Cloudinary Rollback Error]', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
