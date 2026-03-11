import prisma from './client';
import { RawJob } from '@/types';

export async function saveJob(data: Partial<RawJob> & any) {
  const jobData = {
    externalId: data.externalId,
    title: data.title,
    company: data.company,
    description: data.description || '',
    requirements: data.requirements || '',
    skills: data.skills || [],
    location: data.location || null,
    source: data.source,
    applyUrl: data.applyUrl || data.url || '',
    matchScore: data.matchScore || null,
    matchLevel: data.matchLevel || null,
    assessment: data.assessment ?? undefined,
    scrapedAt: data.postedAt ? new Date(data.postedAt) : new Date(),
  };

  const upsert = await prisma.job.upsert({
    where: { externalId: data.externalId },
    update: jobData,
    create: jobData,
  });

  return upsert;
}

export async function getTopJobsToday(limit = 5) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.job.findMany({
    where: {
      scrapedAt: { gte: start },
      matchLevel: { in: ['STRONG', 'GOOD'] },
    },
    orderBy: { matchScore: 'desc' },
    take: limit,
  });
}

export async function markJobsNotified(ids: string[]) {
  await prisma.job.updateMany({
    where: { id: { in: ids } },
    data: { notifiedAt: new Date() },
  });
}