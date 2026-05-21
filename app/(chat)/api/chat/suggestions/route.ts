import { generateChatSuggestions } from "@/lib/ai/generate-chat-suggestions";

export type ChatSuggestionsResponse = {
  suggestions: string[];
};

export async function GET() {
  const suggestions = await generateChatSuggestions();

  return Response.json({ suggestions } satisfies ChatSuggestionsResponse);
}
