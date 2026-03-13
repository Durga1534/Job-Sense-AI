import nodemailer from 'nodemailer';
import { ScoredJob } from '@/types';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendDailyReport(
  jobs: ScoredJob[],
  totalScraped: number,
  date: Date,
) {
  let html = `<h1>JobSense AI Report - ${date.toDateString()}</h1>`;
  html += `<p>Scraped ${totalScraped} jobs, top ${jobs.length} scored.</p>`;

  jobs.forEach((j, idx) => {
    html += `<hr><h2>${idx + 1}. ${j.job.title} at ${j.job.company}</h2>`;
    html += `<p><strong>Score:</strong> ${j.score.score} | ${j.score.matchLevel}</p>`;
    html += `<p><strong>Why apply:</strong> ${j.score.whyApply}</p>`;
    html += `<p><strong>Matching skills:</strong> ${j.score.matchingSkills.join(', ')}</p>`;
    html += `<p><strong>Missing skills:</strong> ${j.score.missingSkills.join(', ')}</p>`;
    html += `<p><strong>Experience gap:</strong> ${j.score.experienceGap}</p>`;
    html += `<p><strong>Salary fit:</strong> ${j.score.salaryFit}</p>`;

    if (j.assessment?.coverLetterHook) {
      html += `<p><strong>Cover letter hook:</strong> ${j.assessment.coverLetterHook}</p>`;
    }
    if (j.assessment?.projectToHighlight) {
      html += `<p><strong>Project to highlight:</strong> ${j.assessment.projectToHighlight}</p>`;
    }
    if (j.bullets?.rewrittenBullets?.length) {
      html += `<p><strong>Rewritten bullets:</strong><br/>${j.bullets.rewrittenBullets.join('<br/>')}</p>`;
    }

    html += `<p><a href="${j.job.applyUrl}">Apply here</a></p>`;
  });

  html += `<footer><p>JobSense AI — running automatically every day.</p></footer>`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: `JobSense AI Daily Report - ${date.toDateString()}`,
    html,
  });
}