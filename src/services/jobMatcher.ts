import { JobMatchingEngine } from '../ai/matching';
import { JobMatchCriteria, JobMatchResult, MatchingWeights } from '../types/matching';
import prisma from '../db/client';
import { disconnect as redisDisconnect } from '../cache/redis';

export class JobMatcherService {
  private matchingEngine: JobMatchingEngine;
  private redis = require('../cache/redis').default;

  constructor() {
    this.matchingEngine = new JobMatchingEngine();
  }

  async getUserCriteria(userId: string): Promise<JobMatchCriteria> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    return {
      skills: user.skills || [],
      experienceLevel: (user.experienceLevel as any) || 'mid',
      locationPreference: user.locationPreference || [],
      salaryRange: {
        min: user.salaryMin || 0,
        max: user.salaryMax || 200000,
      },
      companySize: (user.companySize as any) || undefined,
      industry: user.industry || [],
      remotePreference: (user.remotePreference as any) || 'remote',
    };
  }

  async saveUserCriteria(userId: string, criteria: Partial<JobMatchCriteria>): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        skills: criteria.skills,
        experienceLevel: criteria.experienceLevel,
        locationPreference: criteria.locationPreference,
        salaryMin: criteria.salaryRange?.min,
        salaryMax: criteria.salaryRange?.max,
        companySize: criteria.companySize,
        industry: criteria.industry,
        remotePreference: criteria.remotePreference,
      },
    });

    // Clear cached matches for this user
    await this.redis.del(`user:${userId}:matches`);
  }

  async getPersonalizedMatches(userId: string, limit: number = 10): Promise<JobMatchResult[]> {
    const cacheKey = `user:${userId}:matches:${limit}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const criteria = await this.getUserCriteria(userId);
    const matches = await this.matchingEngine.getTopMatches(criteria, limit);

    // Cache for 30 minutes
    await this.redis.setex(cacheKey, 1800, JSON.stringify(matches));

    return matches;
  }

  async matchSpecificJob(userId: string, jobId: string): Promise<JobMatchResult> {
    const criteria = await this.getUserCriteria(userId);
    return this.matchingEngine.matchJobToCriteria(jobId, criteria);
  }

  async updateMatchingWeights(userId: string, weights: Partial<MatchingWeights>): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        matchingWeights: weights,
      },
    });

    this.matchingEngine.updateWeights(weights);
  }

  async getSkillGapAnalysis(userId: string, jobId: string): Promise<any> {
    const matchResult = await this.matchSpecificJob(userId, jobId);
    
    const skillGaps = matchResult.skillMatch.skillGaps
      .filter(gap => gap.gap > 0)
      .sort((a, b) => b.gap - a.gap);

    const learningResources = await this.generateLearningResources(skillGaps);

    return {
      skillGaps,
      learningResources,
      totalGapScore: skillGaps.reduce((sum, gap) => sum + gap.gap, 0),
      criticalGaps: skillGaps.filter(gap => gap.required && gap.gap >= 3),
    };
  }

  private async generateLearningResources(skillGaps: any[]): Promise<any> {
    // This could integrate with learning platforms or course APIs
    return skillGaps.map(gap => ({
      skill: gap.skill,
      resources: [
        {
          type: 'course',
          title: `Advanced ${gap.skill} Mastery`,
          provider: 'Udemy',
          estimatedTime: '40 hours',
        },
        {
          type: 'tutorial',
          title: `${gap.skill} Best Practices`,
          provider: 'YouTube',
          estimatedTime: '2 hours',
        },
      ],
    }));
  }

  async getMatchingInsights(userId: string): Promise<any> {
    const matches = await this.getPersonalizedMatches(userId, 50);
    
    const insights = {
      averageMatchScore: matches.reduce((sum, match) => sum + match.overallScore, 0) / matches.length,
      topSkills: this.getTopRequiredSkills(matches),
      salaryInsights: this.getSalaryInsights(matches),
      locationInsights: this.getLocationInsights(matches),
      experienceLevelFit: this.getExperienceFit(matches),
    };

    return insights;
  }

  private getTopRequiredSkills(matches: JobMatchResult[]): string[] {
    const skillCounts: { [key: string]: number } = {};
    
    matches.forEach(match => {
      match.skillMatch.matchedSkills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill]) => skill);
  }

  private getSalaryInsights(matches: JobMatchResult[]): any {
    const salaryMatches = matches.map(match => match.salaryMatch);
    
    return {
      averageWithinRange: salaryMatches.filter(sm => sm.withinRange).length / salaryMatches.length * 100,
      averageVariance: salaryMatches.reduce((sum, sm) => sum + sm.variance, 0) / salaryMatches.length,
    };
  }

  private getLocationInsights(matches: JobMatchResult[]): any {
    const locationMatches = matches.map(match => match.locationMatch);
    
    return {
      averagePreferenceScore: locationMatches.reduce((sum, lm) => sum + lm.preference, 0) / locationMatches.length,
    };
  }

  private getExperienceFit(matches: JobMatchResult[]): any {
    const experienceMatches = matches.map(match => match.experienceMatch);
    
    return {
      averageCompatibility: experienceMatches.reduce((sum, em) => sum + em.compatibility, 0) / experienceMatches.length,
    };
  }
}
