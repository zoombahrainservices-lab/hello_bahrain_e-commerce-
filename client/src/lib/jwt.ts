import jwt from 'jsonwebtoken';

export function generateToken(userId: string, role: 'user' | 'admin'): string {
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ id: userId, role }, jwtSecret, { expiresIn: '30d' });
}


