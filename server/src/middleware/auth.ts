import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Try to get token from Authorization header first (more reliable for localhost), then from cookie
    let token = null;
    let tokenSource = 'none';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenSource = 'authorization-header';
    } else if ((req as any).cookies?.token) {
      token = (req as any).cookies.token;
      tokenSource = 'cookie';
    }

    console.log(`🔐 Auth check: ${req.method} ${req.path}`, {
      tokenSource,
      hasAuthHeader: !!authHeader,
      hasCookie: !!(req as any).cookies?.token,
      tokenLength: token?.length || 0,
      cookies: Object.keys((req as any).cookies || {}),
    });

    if (!token) {
      console.log('❌ No token found in Authorization header or cookies');
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      role: 'user' | 'admin';
    };

    console.log(`✅ Token valid for user: ${decoded.id} (${decoded.role})`);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
};
