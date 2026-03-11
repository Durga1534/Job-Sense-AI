# JobSense AI — Autonomous Job Hunt Agent

![build](https://img.shields.io/badge/build-passing-brightgreen)
![node](https://img.shields.io/badge/node-22-blue)
![typescript](https://img.shields.io/badge/typescript-5.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)

A personal automation agent that scrapes job portals every morning, scores each listing against my resume using Gemini AI, and delivers a ranked WhatsApp digest and email report — automatically, every day.

Built because I was tired of manually checking 4 job boards every morning.

---

## How It Works

```
QStash (daily schedule)
    ↓
Express Webhook
    ↓
Scrapers (Adzuna · Remotive · Arbeitnow)
    ↓
Redis Deduplication (Upstash · 7-day TTL)
    ↓
Gemini AI Pipeline
    ├── scoreJob              → match score, skill gaps, salary fit
    ├── assessResumeForJob    → hiring manager feedback, project to highlight
    └── rewriteBulletsForJob  → keyword-optimized resume bullets
    ↓
PostgreSQL (Neon · via Prisma)
    ↓
Notifications
    ├── WhatsApp digest (Twilio)
    └── Email report (Nodemailer)
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js 22 | Runtime |
| TypeScript | Language |
| Express.js | Web framework |
| PostgreSQL (Neon) | Primary database |
| Prisma ORM | Database access |
| Redis (Upstash) | Job deduplication cache |
| Gemini AI | Scoring, assessment, bullet rewriting |
| QStash | Daily scheduling and webhook delivery |
| Twilio WhatsApp | Morning digest notification |
| Nodemailer | Email report |
| Arcjet | Rate limiting and bot protection |
| Docker Compose | Local development environment |
| Koyeb | Cloud deployment |

---

## AI Pipeline Detail

Each new job goes through up to 3 Gemini AI steps:

**1. scoreJob — runs on all new jobs**
Scores the job 0–100 against the candidate resume. Returns:
- Match level: STRONG / GOOD / WEAK / SKIP
- Matching and missing skills
- Experience gap analysis
- Salary fit assessment
- Why to apply

**2. assessResumeForJob — STRONG matches only**
Hiring manager perspective on the candidate for this specific role. Returns:
- Overall verdict
- Strengths and weaknesses
- Which project to highlight and why
- Keywords to add to resume
- Personalized cover letter hook
- Projected score if gaps are fixed

**3. rewriteBulletsForJob — STRONG matches only**
Rewrites resume project bullets to be metric-driven and keyword-optimized for this specific job. Only uses skills already on the resume — no fabrication.

---

## Project Structure

```
src/
├── ai/
│   ├── client.ts         # Gemini client with retry logic
│   ├── resume.ts         # Candidate resume as structured constant
│   ├── scorer.ts         # Job scoring prompt
│   ├── assessor.ts       # Resume assessment prompt
│   └── improver.ts       # Bullet rewriter prompt
├── cache/
│   └── redis.ts          # Upstash deduplication with 7-day TTL
├── db/
│   ├── jobs.ts           # Save scored jobs to PostgreSQL
│   └── runs.ts           # Daily run tracking
├── middleware/
│   ├── arcjet.ts         # Rate limiting and bot protection
│   └── qstash.ts         # QStash signature verification
├── notifications/
│   ├── whatsapp.ts       # Twilio WhatsApp digest
│   └── email.ts          # Nodemailer email report
├── routes/
│   └── trigger.ts        # Main pipeline route
├── scrapers/
│   ├── adzuna.ts         # Adzuna Jobs API
│   ├── remotive.ts       # Remotive API
│   ├── arbeitnow.ts      # Arbeitnow API
│   └── index.ts          # Run all scrapers
└── app.ts                # Express app entry point
```

---

## Quick Start

### Prerequisites
- Node.js 22+
- Neon PostgreSQL database
- Upstash Redis database
- Gemini API key (free tier)
- QStash account (free tier)
- Twilio account (for WhatsApp)
- Gmail account (for email reports)

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/jobsense-ai
cd jobsense-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your values

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### Trigger the pipeline manually

```bash
curl -X POST http://localhost:3000/webhook/trigger
```

---

## Environment Variables

```env
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=rediss://...

# AI
GEMINI_API_KEY=your_key

# QStash
QSTASH_TOKEN=your_token
QSTASH_CURRENT_SIGNING_KEY=your_key
QSTASH_NEXT_SIGNING_KEY=your_key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
YOUR_WHATSAPP_NUMBER=whatsapp:+91XXXXXXXXXX

# Email
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_TO=your@gmail.com

# Security
ARCJET_KEY=ajkey_xxx
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/webhook/trigger` | QStash daily pipeline trigger |
| GET | `/health` | Service health check |
| GET | `/jobs` | View all scored jobs |

---

## Deployment

Deployed on **Koyeb** (free tier) with:
- **Neon** for PostgreSQL
- **Upstash** for Redis  
- **QStash** for daily scheduling

```bash
# Build
npm run build

# Start
node dist/app.js
```

Update your QStash webhook URL to your Koyeb deployment URL after deploying.

---

## Design Decisions

**Why APIs instead of scraping?**
Instahyre, Wellfound, and Cutshort all use Cloudflare bot protection — Axios + Cheerio returns undefined before parsing anything. Switching to open APIs made scrapers reliable and maintainable.

**Why hardcode the resume instead of uploading a PDF?**
This is a personal automation tool — the resume doesn't change daily. A structured TypeScript constant gives Gemini clean, parseable context on every API call without needing file upload infrastructure.

**Why score only 10 jobs per run?**
Gemini free tier has a daily quota. Scoring all 140 jobs × 3 AI calls = 420 API calls per run. Limiting to top 10 new jobs keeps usage within free tier permanently.

---

## Author

**Konduru Durga Prasad**
Full Stack Developer · Backend Engineer · Bangalore, India

[GitHub](https://github.com/Durga1534) · [LinkedIn](https://linkedin.com/in/konduru-durga-prasad) · kondurudurgaprasad.2@gmail.com