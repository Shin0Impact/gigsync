import { Request, Response } from 'express';

// Stub controller - Dev 1 owns auth per the design doc's division of work.
// Wire these up to bcrypt + jsonwebtoken + the users table.

export async function register(_req: Request, res: Response) {
  // TODO: validate body, hash password with bcrypt, insert into `users`,
  // issue access/refresh JWTs as HTTP-only cookies.
  res.status(501).json({ error: 'Not implemented: POST /api/auth/register' });
}

export async function login(_req: Request, res: Response) {
  // TODO: look up user by email, compare bcrypt hash, issue JWT cookies.
  res.status(501).json({ error: 'Not implemented: POST /api/auth/login' });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  // requireAuth middleware guarantees req.user is set here.
  res.json({ user: req.user ?? null });
}
