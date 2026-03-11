import prisma from './client';

export async function saveResumeHealth(health: any) {
  const latest = await prisma.resumeVersion.findFirst({
    orderBy: { version: 'desc' },
  });
  const version = (latest?.version || 0) + 1;
  return prisma.resumeVersion.create({
    data: {
      version,
      content: health,
      healthScore: health.overallScore,
      breakdown: health.breakdown,
      actions: health.topThreeActionsThisWeek,
    },
  });
}

export async function getLatestResumeHealth() {
  return prisma.resumeVersion.findFirst({ orderBy: { version: 'desc' } });
}
