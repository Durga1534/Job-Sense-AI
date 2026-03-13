export interface JobMatchCriteria {
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  locationPreference: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  industry?: string[];
  remotePreference: 'remote' | 'hybrid' | 'onsite';
}

export interface SkillGap {
  skill: string;
  required: boolean;
  currentLevel?: number;
  requiredLevel: number;
  gap: number;
}

export interface JobMatchResult {
  jobId: string;
  overallScore: number;
  skillMatch: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    skillGaps: SkillGap[];
  };
  experienceMatch: {
    score: number;
    compatibility: number;
  };
  salaryMatch: {
    score: number;
    withinRange: boolean;
    variance: number;
  };
  locationMatch: {
    score: number;
    preference: number;
  };
  companyFit: {
    score: number;
    cultureFit: number;
  };
  recommendations: string[];
  redFlags: string[];
}

export interface MatchingWeights {
  skills: number;
  experience: number;
  salary: number;
  location: number;
  company: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  skills: 0.35,
  experience: 0.25,
  salary: 0.20,
  location: 0.10,
  company: 0.10,
};
