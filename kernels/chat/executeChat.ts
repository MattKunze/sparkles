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

    const stream = await openai.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      messages,
      stream: true,
    });

    const response = await streamResponse(executionPath, start, stream);
    await deleteIntermediateOutput(executionPath);

    // capture the final response
    // const response = await stream.finalChatCompletion();
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
  stream: AsyncIterable<OpenAI.ChatCompletionChunk>
): Promise<OpenAI.ChatCompletion> {
  // stream the data and emit the results occasionally
  const tokens: string[] = [];
  let flushPos = 0;
  let ts = Date.now();
  let chunk: OpenAI.ChatCompletionChunk | undefined = undefined;
  for await (chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      tokens.push(token);
      if (Date.now() - ts > 250) {
        await outputResult(executionPath, {
          chat: {
            duration: Date.now() - start.getTime(),
            stream: tokens.slice(flushPos),
          },
        });
        flushPos = tokens.length;
        ts = Date.now();
      }
    }
  }

  if (!chunk) {
    throw new Error("Empty response");
  }

  return {
    ...chunk,
    object: "chat.completion",
    choices: [
      {
        ...chunk.choices[0],
        message: {
          content: tokens.join(""),
          role: "assistant",
        },
      } as OpenAI.ChatCompletion.Choice,
    ],
  };
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
