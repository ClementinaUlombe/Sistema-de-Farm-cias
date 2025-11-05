
import { sign, verify } from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string) {
  return await hash(password, 10);
}

export async function comparePasswords(password: string, hash: string) {
  return await compare(password, hash);
}

export function generateToken(payload: object) {
  return sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string) {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
