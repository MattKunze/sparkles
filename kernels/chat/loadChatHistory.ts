import { readFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import superjson from "superjson";

import { ExecutionMetaInfo } from "@/types";

import { config } from "./config";
import { loadExecutionMessages } from "./loadExecutionMessages";

export async function loadChatHistory(filename: string) {
  const executionPath = path.dirname(filename);
  const meta = superjson.parse(
    await readFile(path.resolve(executionPath, "meta.json"), "utf-8")
  ) as ExecutionMetaInfo;

  let messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: config.systemPrompt,
    },
  ];

  if (meta.linkedExecutionIds) {
    for (const linkedExecutionId of meta.linkedExecutionIds) {
      messages = messages.concat(
        await loadExecutionMessages(
          path.resolve(executionPath, "..", linkedExecutionId)
        )
      );
    }
  }

  // add current user prompt
  messages.push(JSON.parse(await readFile(filename, "utf-8")));

  return messages;
}
