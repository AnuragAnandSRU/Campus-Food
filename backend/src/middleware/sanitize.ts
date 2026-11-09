import { Request, Response, NextFunction } from 'express';

/**
 * Recursively removes any object keys that begin with '$' (MongoDB operators like $gt, $ne, $where)
 * or contain '.' (nested document manipulation) to neutralize NoSQL injection attempts.
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Strip prohibited MongoDB operator keys or nested traversal dots
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

/**
 * Middleware that inspects and sanitizes req.body, req.query, and req.params
 * before request handlers process user input.
 */
export function sanitizeNoSql(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as Request['query'];
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as Request['params'];
  }
  next();
}

