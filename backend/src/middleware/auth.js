import { verifyToken } from '../services/jwt-service.js';

export function requireAdminToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, status: 401, message: 'Missing authorization token', data: null });
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, status: 403, message: 'Forbidden', data: null });
    }
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, status: 401, message: 'Invalid or expired token', data: null });
  }
}
