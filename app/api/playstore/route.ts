import { NextRequest, NextResponse } from 'next/server';
import { extractPackageName, fetchPlayStoreMetadata, checkRateLimit } from '@/lib/playstore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'Google Play Store URL or Package Name is required.' },
        { status: 400 }
      );
    }

    const packageName = extractPackageName(url);

    if (!packageName) {
      return NextResponse.json(
        { error: 'Invalid Google Play URL or Package Name. Example: https://play.google.com/store/apps/details?id=com.whatsapp or com.whatsapp' },
        { status: 400 }
      );
    }

    const metadata = await fetchPlayStoreMetadata(packageName);

    return NextResponse.json({
      success: true,
      packageName: metadata.packageName,
      appName: metadata.appName,
      appIcon: metadata.appIcon,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to fetch Play Store information.';
    const isNotFound = message.includes('not found') || message.includes('Application not found');
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
