import dotenv from "dotenv";
import { readFile } from "fs/promises";
import OpenAI from "openai";

const DefaultSystemPrompt =
  "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.";

export const config: {
  openai: OpenAI | undefined;
  model: string;
  systemPrompt: string;
  temperature: number | null;
} = {
  openai: undefined,
  model: "unused",
  systemPrompt: DefaultSystemPrompt,
  temperature: null,
};

let prevConfig: string;
export async function loadConfig(envFile: string) {
  const content = await readFile(envFile, "utf-8");
  if (content === prevConfig) {
    return;
  }
  prevConfig = content;
  const env = dotenv.parse(content);

  config.openai = new OpenAI({
    baseURL: env.CHAT_ENDPOINT,
    apiKey: env.CHAT_API_KEY,
  });
  config.systemPrompt = env.CHAT_SYSTEM_PROMPT || DefaultSystemPrompt;

  config.temperature = null;
  try {
    const t = parseFloat(env.CHAT_TEMPERATURE);
    if (t >= 0 && t <= 2) {
      config.temperature = t;
    }
  } catch {}

  console.info("Loaded config", config);
}
