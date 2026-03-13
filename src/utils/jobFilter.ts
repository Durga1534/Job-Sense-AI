export function isFresherJob(title: string, description: string, requirements: string): boolean {
  const text = `${title} ${description} ${requirements}`.toLowerCase();
  
  // Exclude experienced job indicators
  const excludeKeywords = [
    '3+ years', '3 years', '4+ years', '5+ years', 'senior', 'lead', 'principal',
    'architect', 'staff', 'expert', '3-5 years', '4-6 years', '5-8 years'
  ];
  
  // Include fresher-friendly indicators
  const includeKeywords = [
    'fresher', 'fresh', 'entry level', 'junior', 'trainee', 'internship',
    '0-1 years', '0-2 years', 'recent graduate', 'graduate', 'fresher friendly',
    'no experience', 'entry level', 'beginner', 'starter'
  ];
  
  // Check for exclusion keywords first
  const hasExclusion = excludeKeywords.some(keyword => text.includes(keyword));
  if (hasExclusion) return false;
  
  // Check for inclusion keywords
  const hasInclusion = includeKeywords.some(keyword => text.includes(keyword));
  return hasInclusion;
}

export function extractExperienceLevel(title: string, description: string, requirements: string): string {
  const text = `${title} ${description} ${requirements}`.toLowerCase();
  
  // Check for specific experience requirements
  if (text.includes('3+ years') || text.includes('3 years') || text.includes('4+') || text.includes('5+')) {
    return '3+';
  }
  if (text.includes('2 years') || text.includes('2-3') || text.includes('2+')) {
    return '2';
  }
  if (text.includes('0-1') || text.includes('fresher') || text.includes('entry level') || text.includes('junior')) {
    return '0-1';
  }
  
  // Default assumption - if not specified, assume it could be entry level
  return 'not-specified';
}
