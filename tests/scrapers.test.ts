import axios from 'axios';
import { scrapeCutshort } from '../src/scrapers/cutshort';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('scrapers', () => {
  it('cutshort returns RawJob array', async () => {
    mockedAxios.create.mockReturnThis();
    mockedAxios.get.mockResolvedValue({ data: '<div class="job-card"></div>' });
    const jobs = await scrapeCutshort();
    expect(Array.isArray(jobs)).toBe(true);
  });
});
