import request from 'supertest';
import app from '../src/app';
import * as scrapers from '../src/scrapers';
import * as redis from '../src/cache/redis';
import * as scorer from '../src/ai/scorer';
import * as assessor from '../src/ai/assessor';
import * as improver from '../src/ai/improver';
import * as whatsapp from '../src/notifications/whatsapp';
import * as email from '../src/notifications/email';
import * as qstash from '../src/middleware/qstash';

jest.mock('../src/middleware/qstash');
jest.mock('../src/cache/redis');
jest.mock('../src/scrapers');
jest.mock('../src/ai/scorer');
jest.mock('../src/ai/assessor');
jest.mock('../src/ai/improver');
jest.mock('../src/notifications/whatsapp');
jest.mock('../src/notifications/email');

(qstash.verifyQStash as jest.Mock).mockImplementation((req, res, next) => next());
(redis.filterNewJobs as jest.Mock).mockResolvedValue([]);
(scrapers.runAllScrapers as jest.Mock).mockResolvedValue([]);
(scorer.scoreJob as jest.Mock).mockResolvedValue({ matchLevel: 'SKIP' });
(assessor.assessResumeForJob as jest.Mock).mockResolvedValue({});
(improver.rewriteBulletsForJob as jest.Mock).mockResolvedValue({});
(whatsapp.sendDailyDigest as jest.Mock).mockResolvedValue(undefined);
(whatsapp.sendNoJobsAlert as jest.Mock).mockResolvedValue(undefined);
(email.sendDailyReport as jest.Mock).mockResolvedValue(undefined);

describe('webhook pipeline', () => {
  it('runs without errors when no jobs', async () => {
    const res = await request(app).post('/webhook/trigger').send({});
    expect(res.status).toBe(200);
    expect(res.body.jobsScraped).toBe(0);
  });
});
