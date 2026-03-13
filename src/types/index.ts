export interface RawJob {
  externalId: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  skills: string[];
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  remote?: boolean;
  applyUrl: string;
  source: 'adzuna' | 'naukri' | 'remotive' | 'arbeitnow' | 'cutshort' | 'hirect' | 'wellfound';
  postedAt: string;
}

export interface JobScore {
  score: number;
  matchLevel: 'STRONG' | 'GOOD' | 'WEAK' | 'SKIP';
  matchingSkills: string[];
  missingSkills: string[];
  experienceGap: string;
  whyApply: string;
  salaryFit: string;
}

export interface JobAssessment {
  overallVerdict: string;
  strengths: string[];
  weaknesses: string[];
  bulletImprovements: Array<{
    project: string;
    current: string;
    improved: string;
    why: string;
  }>;
  keywordsToAdd: string[];
  projectToHighlight: string;
  projectReason: string;
  coverLetterHook: string;
  scoreIfFixed: number;
}

export interface BulletRewrite {
  projectName: string;
  rewrittenBullets: string[];
  keywordsAdded: string[];
}

export interface ScoredJob {
  job: any; // will use Prisma type later
  score: JobScore;
  assessment: JobAssessment;
  bullets: BulletRewrite;
}

export interface ResumeHealth {
  overallScore: number;
  breakdown: {
    projectQuality: number;
    skillsRelevance: number;
    metricsAndNumbers: number;
    atsOptimization: number;
    productionEvidence: number;
  };
  topThreeActionsThisWeek: string[];
  strongestAsset: string;
  biggestGap: string;
  estimatedDaysToInterviewReady: number;
}
