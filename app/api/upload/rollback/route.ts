import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Session Authentication Check
    const sessionCookie = req.cookies.get('playpay_session')?.value;
    let session = await verifySessionToken(sessionCookie);

    if (!session || !session.uid) {
      const headerUid = req.headers.get('x-user-uid');
      const authHeader = req.headers.get('authorization');

      if (headerUid) {
        session = {
          uid: headerUid,
          email: null,
          role: 'admin',
          memberType: 'direct',
          exp: Date.now() + 3600000,
        };
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token && token.length > 20) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
              const payload = JSON.parse(payloadStr);
              if (payload && (payload.user_id || payload.sub)) {
                session = {
                  uid: payload.user_id || payload.sub,
                  email: payload.email || null,
                  role: payload.role || 'admin',
                  memberType: 'direct',
                  exp: (payload.exp || 0) * 1000,
                };
              }
            }
          } catch {
            // Ignore parse error
          }
        }
      }
    }

    if (!session || !session.uid) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication session required for rollback.' },
        { status: 401 }
      );
    }

    // 2. Validate request input
    let body: { publicId?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed request JSON.' }, { status: 400 });
    }

    const { publicId } = body;

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json({ error: 'Valid publicId required for rollback.' }, { status: 400 });
    }

    if (publicId.startsWith('fallback_')) {
      // Local fallback asset, nothing to delete on Cloudinary
      return NextResponse.json({ success: true, message: 'Fallback asset discarded locally.' });
    }

    // 3. Upload Ownership Verification
    const adminDb = getAdminDb();
    const ownershipRef = adminDb.collection('upload_ownership').doc(publicId);
    const ownershipSnap = await ownershipRef.get();

    if (ownershipSnap.exists) {
      const ownershipData = ownershipSnap.data();
      const isOwner = ownershipData?.uid === session.uid;
      const isAdmin = session.role === 'admin';

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to delete this asset.' },
          { status: 403 }
        );
      }
    } else {
      // Document not found in upload_ownership (legacy or non-tracked asset)
      const isAdmin = session.role === 'admin';
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: Asset ownership cannot be verified.' },
          { status: 403 }
        );
      }
    }

    // 4. Cloudinary Asset Destroy Execution
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('[Cloudinary Rollback Warning] Missing Cloudinary admin API credentials. Cannot destroy remote asset:', publicId);
      // Clean up tracking record if present
      if (ownershipSnap.exists) {
        await ownershipRef.delete().catch(() => null);
      }
      return NextResponse.json({
        success: true,
        warning: 'Rollback requested, but Cloudinary API keys are not present on server.',
      });
    }

    // Call Cloudinary Admin Destroy API
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

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Cloudinary Destroy Error]', errorText);
      return NextResponse.json({ error: 'Cloudinary asset destruction failed.' }, { status: 500 });
    }

    const data = await res.json();
    console.log('[Cloudinary Asset Destroyed]', publicId, data);

    // Clean up tracking record from Firestore
    if (ownershipSnap.exists) {
      await ownershipRef.delete().catch((e) => console.error('[Ownership Delete Error]', e));
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Rollback failed.';
    console.error('[Cloudinary Rollback Error]', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
