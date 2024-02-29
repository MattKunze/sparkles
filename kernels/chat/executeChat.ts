import { readdir, rm } from "fs/promises";
import OpenAI from "openai";
import path from "path";

import { config } from "./config";
import { formatError } from "./formatError";
import { loadChatHistory } from "./loadChatHistory";
import { outputResult } from "./outputResult";

export async function executeChat(filename: string) {
  console.info(`Executing chat: ${filename}`);
  const executionPath = path.dirname(filename);
  const start = new Date();
  try {
    const { openai } = config;
    if (!openai) {
      throw new Error("OpenAI not initialized");
    }

    const messages = await loadChatHistory(filename);

    const stream = openai.beta.chat.completions.stream({
      model: config.model,
      temperature: config.temperature,
      messages,
    });

    await streamResponse(executionPath, start, stream);
    await deleteIntermediateOutput(executionPath);

    // capture the final response
    const response = await stream.finalChatCompletion();
    await outputResult(executionPath, {
      chat: {
        duration: Date.now() - start.getTime(),
        response,
      },
    });
  } catch (error) {
    await outputResult(executionPath, {
      error: {
        duration: Date.now() - start.getTime(),
        ...formatError(error),
      },
    });

    console.error(
      `Execution failed: ${filename} (${
        error instanceof Error ? error.message : String(error)
      })`
    );
  }
}

async function streamResponse(
  executionPath: string,
  start: Date,
  stream: ReturnType<OpenAI.Beta.Chat.Completions["stream"]>
) {
  // stream the data and emit the results occasionally
  let tokens: string[] = [];
  let ts = Date.now();
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      tokens.push(token);
      if (Date.now() - ts > 250) {
        await outputResult(executionPath, {
          chat: {
            duration: Date.now() - start.getTime(),
            stream: tokens,
          },
        });
        tokens = [];
        ts = Date.now();
      }
    }
  }
}

async function deleteIntermediateOutput(executionPath: string) {
  return Promise.all(
    (await readdir(executionPath))
      .filter(
        (filename) =>
          !filename.endsWith("meta.json") && filename.endsWith(".json")
      )
      .map((filename) => rm(path.resolve(executionPath, filename)))
  );
}
