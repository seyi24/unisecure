import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Query GPT-4o Mini model - ultra cost-effective model
 * @param prompt The prompt to send to the model
 * @returns The model's response
 */
export async function askNano(prompt: string): Promise<string | null> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message?.content ?? null;
}

/**
 * Query GPT-4o Mini with system prompt
 * @param systemPrompt System instructions for the model
 * @param userPrompt The user's message
 * @returns The model's response
 */
export async function askNanoWithSystem(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0].message?.content ?? null;
}
