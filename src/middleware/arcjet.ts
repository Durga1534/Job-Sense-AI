import arcjet, { tokenBucket } from '@arcjet/node';
import { Request, Response, NextFunction } from 'express';

const aj = arcjet({
  key: process.env.ARCJET_KEY || '',
  characteristics: ['ip.src'], // Track by IP
  rules: [
    tokenBucket({
      mode: 'LIVE',
      refillRate: 10,
      interval: '60s',
      capacity: 10,
    }),
  ],
});

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const decision = await aj.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ error: 'Too Many Requests' });
      }
      return res.status(403).json({ error: 'Access Denied' });
    }

    next();
  } catch (err) {
    console.error('Arcjet error:', err);
    next();
  }
}

export default { rateLimit };
