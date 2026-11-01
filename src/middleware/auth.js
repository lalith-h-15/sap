import { jwtVerify } from 'jose';

import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Bearer token required');
    }

    if (!env.jwtSecret) {
      throw new HttpError(503, 'JWT_SECRET is not configured');
    }

    const key = new TextEncoder().encode(env.jwtSecret);

    const { payload } = await jwtVerify(token, key, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    });

    const userId =
      payload.sub ||
      payload.id ||
      payload.userId ||
      payload._id ||
      payload.user?.id ||
      payload.user?._id;

    if (!userId) {
      throw new HttpError(401, 'Token does not contain a user identifier');
    }

    req.user = {
      id: String(userId),
      role: payload.role || payload.user?.role || 'employee',
      email: payload.email || payload.user?.email
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }

    return next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function requireManager(req, _res, next) {
  const allowedRoles = ['manager', 'admin', 'industry'];

  if (!allowedRoles.includes(String(req.user?.role).toLowerCase())) {
    return next(new HttpError(403, 'Manager access required'));
  }

  next();
}