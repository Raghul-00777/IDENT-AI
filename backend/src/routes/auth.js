import express from 'express';
import { CONFIG } from '../config.js';
import { signInSchema } from '../schemas/auth-schema.js';
import { validateBody } from '../middleware/validation.js';
import { createToken, verifyToken } from '../services/jwt-service.js';

const router = express.Router();

router.post('/login', validateBody(signInSchema), (req, res) => {
  const { password } = req.body;
  if (password !== CONFIG.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, status: 401, message: 'Invalid admin password', data: null });
  }

  const token = createToken({ role: 'admin' });
  return res.json({ success: true, status: 200, message: 'Authenticated', data: { token } });
});

router.get('/me', (req, res) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, status: 401, message: 'Missing authorization token', data: null });
  }

  try {
    const payload = verifyToken(token);
    return res.json({ success: true, status: 200, message: 'Authenticated', data: { user: { email: 'admin@ident.ai' }, profile: { full_name: 'Administrator' }, role: payload.role } });
  } catch (error) {
    return res.status(401).json({ success: false, status: 401, message: 'Invalid or expired token', data: null });
  }
});

export default router;
