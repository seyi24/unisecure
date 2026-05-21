import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

export const suggestions = [
  "What are the best practices for creating strong passwords?",
  "How can I protect myself from phishing attacks?",
  "What is two-factor authentication and why is it important?",
  "How do I secure my personal data online?",
];

/** Fallback pool when AI suggestions are unavailable. */
export const suggestionPool = [
  ...suggestions,
  "How do I spot a fake security alert email?",
  "What should I do if I think my account was hacked?",
  "Are public Wi‑Fi networks safe for banking?",
  "How does ransomware spread and how can I avoid it?",
  "What is a password manager and do I need one?",
  "How can I secure my smartphone from malware?",
  "What are signs of a social engineering attack?",
  "How do I check if a website connection is secure?",
  "What is end-to-end encryption in messaging apps?",
  "How should I back up important files safely?",
];

export function pickRandomSuggestions(count = 4): string[] {
  const pool = [...suggestionPool];
  const picked: string[] = [];

  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(index, 1);
    if (item) {
      picked.push(item);
    }
  }

  return picked;
}
