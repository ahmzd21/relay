import { Request, Response, NextFunction } from 'express';
import { verifySessionToken, SessionUser } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.relay_session;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await verifySessionToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}
