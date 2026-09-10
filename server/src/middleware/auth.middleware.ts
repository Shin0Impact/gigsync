import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokenPayload, UserRole } from '../types';
import { ApiError } from './errorHandler';

// Verifies the access-token JWT (read from an HTTP-only cookie) and attaches
// the decoded payload to req.user. TODO: implement refresh-token rotation.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(new ApiError(401, 'Not authenticated'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Role-based access control - use after requireAuth, e.g.
// router.post('/events', requireAuth, requireRole('organizer'), handler)
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}
