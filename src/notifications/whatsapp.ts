import Twilio from 'twilio';
import { ScoredJob } from '@/types';

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || '',
);

async function sendMessage(body: string) {
  await client.messages.create({
    body,
    from: process.env.TWILIO_WHATSAPP_FROM as string,
    to: process.env.YOUR_WHATSAPP_NUMBER as string,
  });
}

export async function sendDailyDigest(jobs: ScoredJob[], date: Date) {
  await sendMessage(`*JobSense AI Digest — ${date.toDateString()}*\n${jobs.length} matches found today.`);

  for (const j of jobs) {
    let msg = `*${j.job.title}* at *${j.job.company}*\n`;
    msg += `Score: ${j.score.score} | ${j.score.matchLevel}\n`;
    msg += `Matching: ${j.score.matchingSkills.slice(0, 3).join(', ')}\n`;
    msg += `Missing: ${j.score.missingSkills.slice(0, 3).join(', ')}\n`;
    if (j.assessment?.coverLetterHook) {
      msg += `Hook: ${j.assessment.coverLetterHook.slice(0, 100)}\n`;
    }
    msg += `Apply: ${j.job.applyUrl}`;

    await sendMessage(msg);
    await new Promise(r => setTimeout(r, 1000));
  }

  await sendMessage(`_Full report sent to your email._`);
}

export async function sendNoJobsAlert(date: Date) {
  await sendMessage(`*JobSense AI*\nNo new jobs found on ${date.toDateString()}`);
}