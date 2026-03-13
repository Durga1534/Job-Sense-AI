import { scoreJob } from '../src/ai/scorer';
import { RawJob } from '../src/types';
import { client } from '../src/ai/client';

jest.mock('../src/ai/client');

const fakeJob: RawJob = {
  externalId: 'test-1',
  title: 'Backend Developer',
  company: 'ExampleCo',
  description: '...',
  requirements: '...',
  skills: ['Node.js'],
  applyUrl: 'http://example.com',
  source: 'cutshort',
};

describe('scoreJob', () => {
  beforeAll(() => {
    (client.messages.create as jest.Mock).mockResolvedValue({
      content: [{ text: JSON.stringify({
        score: 50,
        matchLevel: 'GOOD',
        matchingSkills: ['Node.js'],
        missingSkills: [],
        experienceGap: 'None',
        whyApply: '...',
        salaryFit: 'OK',
      }) }],
    });
  });

  it('returns valid JobScore', async () => {
    const result = await scoreJob(fakeJob);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['STRONG', 'GOOD', 'WEAK', 'SKIP']).toContain(result.matchLevel);
  });
});
