import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: 'user' | 'admin';
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  try {
    // Try to get token from Authorization header first
    const authHeader = req.headers.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookie
      const cookies = req.cookies;
      token = cookies.get('token')?.value;
    }

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, jwtSecret) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: NextRequest): { user: AuthUser } | NextResponse {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  return { user };
}

export function requireAdmin(req: NextRequest): { user: AuthUser } | NextResponse {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  return authResult;
}


