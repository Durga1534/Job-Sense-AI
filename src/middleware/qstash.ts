import { NextFunction, Request, Response } from 'express';
import { Receiver } from '@upstash/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
} as any);

export function verifyQStash(req: Request, res: Response, next: NextFunction) {
  console.log(`[QStash] Verifying request to ${req.path}. NODE_ENV: [${process.env.NODE_ENV}]`);

  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log('[QStash] Skipping verification in development mode');
    return next();
  }

  // Convert Buffer to Uint8Array for QStash verification
  const body = req.body;
  const bodyAsUint8Array = body instanceof Buffer ? new Uint8Array(body) : body;

  // Create a new request object with Uint8Array body
  const reqForVerification = {
    ...req,
    body: bodyAsUint8Array,
  };

  receiver
    .verify(reqForVerification as any)
    .then((verifiedBody: any) => {
      // attach parsed body if needed
      (req as any).qstash = verifiedBody;
      next();
    })
    .catch((err: any) => {
      console.error('qstash verify failed', err);
      res.status(401).send('Unauthorized');
    });
}
