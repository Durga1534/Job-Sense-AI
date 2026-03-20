import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';

import helmet from 'helmet';

import cors from 'cors';

import compression from 'compression';

import * as arcjetMiddleware from './middleware/arcjet';

import webhookRoutes from './routes/webhook';

import jobsRoutes from './routes/jobs';

import prisma from './db/client';

import { disconnect as redisDisconnect } from './cache/redis';



const app = express();



app.use(helmet());

app.use(cors());

app.use(compression());



// Preserve raw body for QStash signature verification

app.use('/webhook', express.raw({ type: '*/*' }));

// JSON for all other routes

app.use((req, res, next) => {

  if (req.path.startsWith('/webhook')) return next();

  express.json()(req, res, next);

});



// global rate limit

app.use(arcjetMiddleware.rateLimit);



// register routes

app.use('/webhook', webhookRoutes);

app.use('/jobs', jobsRoutes);



// Additional health check endpoint for Koyeb (port 8000)

app.get('/health', (req: Request, res: Response) => {

  res.json({ status: 'ok', timestamp: new Date().toISOString() });

});



// centralized error handler

app.use((err: any, req: Request, res: Response, next: NextFunction) => {

  console.error(err);

  res.status(500).json({ error: 'Internal Server Error' });

});



// connect to databases on startup

prisma

  .$connect()

  .then(() => console.log('Connected to Prisma'))

  .catch((err) => console.error('Prisma connection error', err));



// redis connection is initialized when imported; log if needed

console.log('Redis client initialized');



let server = app.listen(process.env.PORT || 3000, () => {

  console.log(`Server started on port ${process.env.PORT || 3000}, env=${process.env.NODE_ENV}`);

});



async function gracefulShutdown() {

  console.log('Received termination signal, shutting down gracefully');

  server.close(async () => {

    console.log('Closed out remaining connections');

    try {

      await prisma.$disconnect();

      await redisDisconnect();

    } catch (e) {

      console.error('error during shutdown', e);

    }

    process.exit(0);

  });

  setTimeout(() => process.exit(1), 10000);

}



process.on('SIGTERM', gracefulShutdown);

process.on('SIGINT', gracefulShutdown);



export default app;

