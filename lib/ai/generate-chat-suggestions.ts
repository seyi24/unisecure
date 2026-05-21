import { generateObject } from "ai";
import { z } from "zod";

import { pickRandomSuggestions, isTestEnvironment } from "@/lib/constants";
import { titleModel } from "@/lib/ai/models";
import { chatSuggestionsPrompt } from "@/lib/ai/prompts";
import { getTitleModel } from "@/lib/ai/providers";

const suggestionsSchema = z.object({
  suggestions: z
    .array(z.string().min(12).max(120))
    .length(4)
    .describe("Four distinct cybersecurity starter questions"),
});

export async function generateChatSuggestions(): Promise<string[]> {
  if (isTestEnvironment) {
    return pickRandomSuggestions(4);
  }

  try {
    const { object } = await generateObject({
      model: getTitleModel(),
      schema: suggestionsSchema,
      system: chatSuggestionsPrompt,
      prompt: `Generate 4 new starter questions. Nonce: ${crypto.randomUUID()}`,
      providerOptions: {
        gateway: { order: titleModel.gatewayOrder },
      },
    });

    return object.suggestions.map((s) => s.trim()).filter(Boolean);
  } catch {
    return pickRandomSuggestions(4);
  }
}
