import { Request, Response } from 'express';
import {
  login_user,
  register_user,
} from '../services/auth.service';

export async function register(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      role,
      user_name,
      artists_type,
    } = req.body;

    if (!email || !password || !role || !user_name) {
      return res.status(400).json({
        error: 'email, password, role, and user_name are required',
      });
    }

    const result = await register_user({
      email,
      password,
      role,
      user_name,
      artists_type,
    });

    const { password_hash, ...safe_user } = result.user;

    return res.status(201).json({
      user: safe_user,
      role: result.role,
      profile: result.profile,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.message === 'Email is already registered' ||
        error.message === 'Username is already taken'
      )
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    if (
      error instanceof Error &&
      (
        error.message === 'Artist type is required for artists' ||
        error.message === 'Only artists can have an artist type'
      )
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    console.error('Registration failed:', error);

    return res.status(500).json({
      error: 'Registration failed',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const {
      identifier,
      password,
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: 'identifier and password are required',
      });
    }

    const result = await login_user({
      identifier,
      password,
    });

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password_hash, ...safe_user } = result.user;

    return res.status(200).json({
      user: safe_user,
      role: result.role,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Invalid credentials'
    ) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (
      error instanceof Error &&
      error.message === 'User role not found'
    ) {
      return res.status(500).json({
        error: 'User role not found',
      });
    }

    console.error('Login failed:', error);

    return res.status(500).json({
      error: 'Login failed',
    });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  res.json({ user: req.user ?? null });
}