import { GoogleGenerativeAI } from '@google/generative-ai';
import { JobMatchCriteria, JobMatchResult, SkillGap, MatchingWeights, DEFAULT_MATCHING_WEIGHTS } from '../types/matching';
import prisma from '../db/client';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class JobMatchingEngine {
  private weights: MatchingWeights;

  constructor(weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS) {
    this.weights = weights;
  }

  async matchJobToCriteria(jobId: string, criteria: JobMatchCriteria): Promise<JobMatchResult> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Job ${jobId} not found`);

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Analyze this job against the candidate's criteria and provide detailed scoring:

    Job Details:
    Title: ${job.title}
    Description: ${job.description}
    Company: ${job.company}
    Location: ${job.location}
    Salary Range: $${job.salaryMin || 'Not specified'} - $${job.salaryMax || 'Not specified'}
    Remote: ${job.remote}
    Required Skills: ${job.skills.join(', ')}

    Candidate Criteria:
    Skills: ${criteria.skills.join(', ')}
    Experience Level: ${criteria.experienceLevel}
    Location Preference: ${criteria.locationPreference.join(', ')}
    Salary Range: $${criteria.salaryRange.min} - $${criteria.salaryRange.max}
    Remote Preference: ${criteria.remotePreference}

    Provide analysis in JSON format:
    {
      "skillMatch": {
        "score": 0-100,
        "matchedSkills": ["skill1", "skill2"],
        "missingSkills": ["skill3", "skill4"],
        "skillGaps": [
          {
            "skill": "skillName",
            "required": true/false,
            "currentLevel": 1-5,
            "requiredLevel": 1-5,
            "gap": 1-5
          }
        ]
      },
      "experienceMatch": {
        "score": 0-100,
        "compatibility": 0-100
      },
      "salaryMatch": {
        "score": 0-100,
        "withinRange": true/false,
        "variance": percentage
      },
      "locationMatch": {
        "score": 0-100,
        "preference": 0-100
      },
      "companyFit": {
        "score": 0-100,
        "cultureFit": 0-100
      },
      "recommendations": ["rec1", "rec2"],
      "redFlags": ["flag1", "flag2"]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      const analysis = JSON.parse(response);
      
      const overallScore = this.calculateOverallScore(analysis);
      
      return {
        jobId,
        overallScore,
        ...analysis
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('AI analysis failed');
    }
  }

  private calculateOverallScore(analysis: any): number {
    return Math.round(
      analysis.skillMatch.score * this.weights.skills +
      analysis.experienceMatch.score * this.weights.experience +
      analysis.salaryMatch.score * this.weights.salary +
      analysis.locationMatch.score * this.weights.location +
      analysis.companyFit.score * this.weights.company
    );
  }

  async batchMatchJobs(jobIds: string[], criteria: JobMatchCriteria): Promise<JobMatchResult[]> {
    const matches = await Promise.allSettled(
      jobIds.map(jobId => this.matchJobToCriteria(jobId, criteria))
    );

    return matches
      .filter((result): result is PromiseFulfilledResult<JobMatchResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
      .sort((a, b) => b.overallScore - a.overallScore);
  }

  async getTopMatches(criteria: JobMatchCriteria, limit: number = 10): Promise<JobMatchResult[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentJobs = await prisma.job.findMany({
      where: { scrapedAt: { gte: today } },
      take: limit * 3, // Get more to filter
      orderBy: { matchScore: 'desc' }
    });

    const jobIds = recentJobs.map(job => job.id);
    return this.batchMatchJobs(jobIds, criteria);
  }

  updateWeights(newWeights: Partial<MatchingWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
  }

  getCurrentWeights(): MatchingWeights {
    return { ...this.weights };
  }
}
