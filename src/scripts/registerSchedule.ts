import fetch from 'node-fetch';

async function run() {
  const url = process.env.RAILWAY_URL + '/webhook/trigger';
  const body = {
    destination: url,
    cron: '15 2 * * *',
  };

  const res = await fetch('https://qstash.upstash.io/v2/schedules', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log('schedule created', data);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});