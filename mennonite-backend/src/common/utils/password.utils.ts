import { createHash } from 'crypto';

export const hashPassword = (password: string): string =>
  createHash('sha256').update(password).digest('hex');
