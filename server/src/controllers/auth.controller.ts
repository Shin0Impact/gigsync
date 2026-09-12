import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { mockUsers } from '../db/mockStore';
import { IUser } from '../types';

let currentDemoUser: IUser = mockUsers['user-artist-1'];

export async function register(req: Request, res: Response) {
  const { email, name, role } = req.body;
  const user: IUser = {
    id: `user-${Date.now()}`,
    email: email || `user${Date.now()}@example.com`,
    name: name || 'Demo User',
    role: role || 'artist',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face',
    isVerified: true,
  };

  mockUsers[user.id] = user;
  currentDemoUser = user;

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: '7d' }
  );

  res.cookie('access_token', token, { httpOnly: true, sameSite: 'lax' });
  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response) {
  const { role, email } = req.body;

  let user: IUser = currentDemoUser;

  if (email) {
    const found = Object.values(mockUsers).find((u) => u.email === email);
    if (found) user = found;
  } else if (role === 'organizer') {
    user = mockUsers['user-org-1'];
  } else if (role === 'fan') {
    user = mockUsers['user-fan-1'];
  } else {
    user = mockUsers['user-artist-1'];
  }

  currentDemoUser = user;

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: '7d' }
  );

  res.cookie('access_token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ user, token });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('access_token');
  res.status(200).json({ success: true });
}

export async function me(req: Request, res: Response) {
  res.json({ user: currentDemoUser });
}

export async function switchRole(req: Request, res: Response) {
  const { role } = req.body;
  if (role === 'organizer') {
    currentDemoUser = mockUsers['user-org-1'];
  } else if (role === 'fan') {
    currentDemoUser = mockUsers['user-fan-1'];
  } else {
    currentDemoUser = mockUsers['user-artist-1'];
  }

  const token = jwt.sign(
    { userId: currentDemoUser.id, role: currentDemoUser.role, email: currentDemoUser.email },
    env.jwt.accessSecret,
    { expiresIn: '7d' }
  );

  res.cookie('access_token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ user: currentDemoUser, token });
}
