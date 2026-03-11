import prisma from './client';

export async function createDailyRun(data: {
  jobsScraped: number;
  jobsNew: number;
  jobsScored: number;
  topScore?: number;
  topCompany?: string;
}) {
  return prisma.dailyRun.create({ data });
}

export async function getRecentRuns(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.dailyRun.findMany({
    where: { ranAt: { gte: since } },
    orderBy: { ranAt: 'desc' },
  });
}
