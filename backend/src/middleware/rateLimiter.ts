import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter:
 * Allows up to 150 requests per minute per IP for regular API consumption.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP. Please slow down and try again shortly.',
  },
});

/**
 * Strict authentication rate limiter:
 * Limits login, registration, and invite acceptance to 15 attempts per 15 minutes per IP
 * to defend against brute-force and credential stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login or registration attempts. Please wait 15 minutes before trying again.',
  },
});

/**
 * Email & OTP action rate limiter:
 * Restricts password reset requests and email verification resends to 5 per hour per IP
 * to prevent spamming transactional email relays.
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many email requests. Please check your spam folder or try again in an hour.',
  },
});
