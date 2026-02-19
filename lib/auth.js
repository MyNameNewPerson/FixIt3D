import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.SESSION_SECRET || 'dev_secret_key';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin';

// Verify Password
export function verifyPassword(inputPassword) {
  // In production, use bcrypt/argon2. For MVP, we use the env password directly.
  return inputPassword === ADMIN_PASS;
}

// Issue Token
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

// Verify Token (Middleware)
export function verifyAdmin(req, res, next) {
  // Check cookie or header
  const token = req.cookies?.admin_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== 'admin') {
      throw new Error('Invalid role');
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
