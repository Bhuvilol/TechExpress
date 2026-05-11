import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Unauthorized, Forbidden } from '../utils/errors.js';

// JWT payload shape: { sub: userId, role, email, institutionId? }
// `sub` is standard; we mirror it as `id` on req.user for ergonomic access.

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, email: user.email, institutionId: user.institution?.id ?? null },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY },
  );

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

const verify = (token) => {
  try {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw Unauthorized('Token expired', { code: 'TOKEN_EXPIRED' });
    throw Unauthorized('Invalid token');
  }
};

const attachUser = (req, payload) => {
  req.user = {
    id: payload.sub,
    role: payload.role,
    email: payload.email,
    institutionId: payload.institutionId ?? null,
  };
};

// Hard requirement: 401 if missing or invalid.
export const requireAuth = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next(Unauthorized('Authentication required'));
  try {
    attachUser(req, verify(token));
    next();
  } catch (err) {
    next(err);
  }
};

// Best-effort: attach user if a valid token is present, otherwise continue anonymous.
export const optionalAuth = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    attachUser(req, verify(token));
  } catch {
    // ignore — caller treats request as anonymous
  }
  next();
};

// Role gate. Compose AFTER requireAuth.
//   router.get('/admin/x', requireAuth, requireRole('ADMIN'), handler)
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(Unauthorized('Authentication required'));
  if (!roles.includes(req.user.role)) {
    return next(Forbidden('Insufficient role', { required: roles, actual: req.user.role }));
  }
  next();
};
