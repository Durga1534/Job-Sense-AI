export const MY_RESUME = {
  name: 'Konduru Durga Prasad',
  location: 'Bangalore India',
  email: 'kondurudurgaprasad.2@gmail.com',
  targetRoles: ['Backend Engineer', 'Full Stack Developer', 'Node.js Developer'],
  targetSalary: '6-15 LPA',
  experience: 'Fresher 0 years full-time',
  skills: {
    core: ['Node.js', 'TypeScript', 'Express.js', 'REST APIs'],
    databases: ['PostgreSQL', 'MongoDB', 'Redis'],
    frontend: ['React.js', 'Next.js', 'Tailwind CSS'],
    devops: ['Docker', 'Docker Compose', 'Railway', 'Vercel'],
    security: ['JWT', 'RBAC', 'Arcjet', 'Row Level Security'],
    ai: ['Claude API', 'Gemini API', 'Prompt Engineering'],
    queues: ['QStash', 'Upstash', 'Webhook Orchestration'],
  },
  projects: [
    {
      name: 'Rate Limiter API Gateway',
      metrics: '100+ req/min, 30% DB load reduction, 25% faster response',
      stack: 'Node.js, TypeScript, Redis, PostgreSQL, Docker Compose',
      highlights:
        'dual auth model, layered architecture, Winston logging',
    },
    {
      name: 'Subscription Tracker API',
      metrics: 'zero cron polling, event-driven architecture',
      stack: 'Node.js, MongoDB, Arcjet, QStash, Upstash',
      highlights: 'bot detection, adaptive rate limiting',
    },
    {
      name: 'Converso Voice AI Platform',
      metrics: '500+ concurrent users, 220ms response, 99.5% uptime',
      stack:
        'Next.js, TypeScript, Supabase, PostgreSQL, Clerk',
      highlights: 'Row Level Security, RBAC, Vapi AI',
    },
    {
      name: 'Prep-AI Interview Platform',
      metrics: '20+ questions per session, 85% relevance, 60% faster load',
      stack: 'React, Node.js, Firebase, Gemini API',
      highlights: 'prompt engineering, 10+ technical roles',
    },
    {
      name: 'FreelanceFlow Client Platform',
      metrics: '80% billing reduction, 30% KPI acceleration',
      stack: 'Next.js, TypeScript, Appwrite, Stripe, Recharts',
      highlights: 'Stripe webhooks, PDF invoices, CodeQL scanning',
    },
  ],
  gaps: [
    'GraphQL no project uses it',
    'AWS using Railway Vercel instead',
    'Testing Jest not added yet',
    '0 years formal work experience',
  ],
};
