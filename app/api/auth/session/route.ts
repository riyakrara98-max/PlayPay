import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, role, memberType } = body || {};

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const token = await createSessionToken({
      uid,
      email: email || null,
      role: role || 'user',
      memberType: memberType || 'pending',
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('playpay_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('[Session Route Error]', error);
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('playpay_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('playpay_session')?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, session });
}
