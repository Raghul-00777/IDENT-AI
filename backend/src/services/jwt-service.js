import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';

export function createToken(payload) {
  return jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '12h' });
}

export function verifyToken(token) {
  return jwt.verify(token, CONFIG.JWT_SECRET);
}
