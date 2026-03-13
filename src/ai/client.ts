import Groq from 'groq-sdk';
import { usageTracker } from './usageTracker';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function callAI(prompt: string, maxTokens = 1000): Promise<any> {
  // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
  const estimatedTokens = Math.ceil(prompt.length / 4) + maxTokens;
  
  // Check usage limits before making API call
  const usageCheck = await usageTracker.trackUsage(estimatedTokens);
  
  if (!usageCheck.allowed) {
    console.warn(`🚫 Groq API limit reached. Daily tokens: ${usageCheck.stats.dailyTokens}/${14000}`);
    throw new Error('AI service temporarily unavailable - daily limit reached');
  }
  
  console.log(`🤖 Groq API usage: ${usageCheck.stats.dailyTokens + estimatedTokens}/14000 tokens (${usageCheck.remaining} remaining)`);

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      const text = result.choices[0]?.message?.content || '';
      if (!text) throw new Error('Empty response from AI');

      const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`No JSON found in AI output:\n${cleaned}`);
      }

      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        throw new Error(`Failed to parse AI output: ${err}\n${cleaned}`);
      }
    } catch (err: any) {
      if (err?.status === 429 && attempt < maxRetries) {
        console.warn(`⏳ Groq rate limit hit, retry ${attempt}/${maxRetries} in ${10000 * attempt}ms`);
        await new Promise(r => setTimeout(r, 10000 * attempt));
        continue;
      }
      throw err;
    }
  }
}