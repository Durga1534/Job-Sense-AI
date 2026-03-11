import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$on('error' as any, (e: any) => {
  console.error('Prisma error', e);
});

export default prisma;
