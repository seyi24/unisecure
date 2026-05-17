import { customProvider, gateway } from "ai";
import { openai } from "@ai-sdk/openai";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  // Use the OpenAI SDK only when a direct API key is configured (typical locally).
  // On Vercel, AI Gateway auth is automatic via OIDC — no OPENAI_API_KEY required.
  const openAiApiKey = process.env.OPENAI_API_KEY?.trim();
  if (modelId.startsWith("openai/") && openAiApiKey) {
    return openai(modelId.replace("openai/", ""));
  }

  return gateway.languageModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return gateway.languageModel(titleModel.id);
}
