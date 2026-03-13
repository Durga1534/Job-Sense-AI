import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function callAI(prompt: string, maxTokens = 1000): Promise<any> {
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
        await new Promise(r => setTimeout(r, 10000 * attempt));
        continue;
      }
      throw err;
    }
  }
}