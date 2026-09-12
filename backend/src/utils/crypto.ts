import crypto from 'crypto';

/**
 * Generate a cryptographically random token (sent to the user via email).
 */
export const generateRawToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for storage. We store only the hash so a leaked database
 * cannot be used to forge verification / reset links.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
