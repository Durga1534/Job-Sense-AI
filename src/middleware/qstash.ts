import { NextFunction, Request, Response } from 'express';
import { Receiver } from '@upstash/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

export function verifyQStash(req: Request, res: Response, next: NextFunction) {
  console.log(`[QStash] Verifying request to ${req.path}. NODE_ENV: [${process.env.NODE_ENV}]`);

  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log('[QStash] Skipping verification in development mode');
    return next();
  }

  const signature = req.headers['upstash-signature'] as string;

  if (!signature) {
    console.error('[QStash] Missing upstash-signature header');
    return res.status(401).send('Unauthorized');
  }

  // Convert Buffer to string
  let bodyStr: string;
  if (Buffer.isBuffer(req.body)) {
    bodyStr = req.body.toString('utf-8');
  } else if (typeof req.body === 'string') {
    bodyStr = req.body;
  } else {
    bodyStr = JSON.stringify(req.body);
  }

  receiver
    .verify({
      signature,
      body: bodyStr,
    })
    .then(() => {
      next();
    })
    .catch((err: any) => {
      console.error('qstash verify failed', err);
      res.status(401).send('Unauthorized');
    });
}