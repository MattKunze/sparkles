import chokidar from "chokidar";
import dotenv from "dotenv";
import { rm, readdir, readFile, writeFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import Queue from "queue";
import superjson from "superjson";

import { serverConfig } from "@/config";
import {
  ExecutionErrorResult,
  ExecutionMetaInfo,
  ExecutionChatResult,
  NotebookCell,
  NotebookDocument,
} from "@/types";

const DefaultSystemPrompt =
  "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.";

export async function enqueueExecution(
  basePath: string,
  executionId: string,
  _document: NotebookDocument,
  cell: NotebookCell
) {
  if (!openai) {
    await initialize(basePath);
  }

  const prompt = {
    role: "user",
    content: cell.content,
  };

  await writeFile(
    path.resolve(basePath, executionId, "raw.prompt"),
    JSON.stringify(prompt, null, 2)
  );
}

// todo - move everything below into a container
let openai: OpenAI;
let q: Queue;

async function initialize(basePath: string) {
  q = new Queue({
    autostart: true,
    concurrency: 1,
    timeout: 10 * 60 * 1000,
  });
  chokidar
    .watch(`${serverConfig.WORKSPACE_ROOT}/**/*.prompt`, {
      ignoreInitial: true,
    })
    .on("add", (filename) => {
      console.info(`Queuing chat: ${filename}`);
      q.push(executeChat.bind(null, filename));
    });

  const env = await readEnvironment(basePath);
  openai = new OpenAI({
    baseURL: env.CHAT_ENDPOINT,
    apiKey: env.CHAT_API_KEY,
  });

  // ugh
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function readEnvironment(basePath: string) {
  const content = await readFile(path.resolve(basePath, ".env"), "utf-8");
  return dotenv.parse(content);
}

async function executeChat(filename: string) {
  console.info(`Executing chat: ${filename}`);
  const executionPath = path.dirname(filename);
  const start = new Date();
  try {
    const messages = await loadChatHistory(filename);

    const stream = openai.beta.chat.completions.stream({
      model: "unused",
      messages,
    });

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

    // delete intermediate output
    await Promise.all(
      (await readdir(executionPath))
        .filter(
          (filename) =>
            !filename.endsWith("meta.json") && filename.endsWith(".json")
        )
        .map((filename) => rm(path.resolve(executionPath, filename)))
    );

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

async function loadChatHistory(filename: string) {
  const executionPath = path.dirname(filename);
  const meta = superjson.parse(
    await readFile(path.resolve(executionPath, "meta.json"), "utf-8")
  ) as ExecutionMetaInfo;

  let messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: DefaultSystemPrompt,
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

async function loadExecutionMessages(executionPath: string) {
  const prompt = JSON.parse(
    await readFile(path.resolve(executionPath, "raw.prompt"), "utf-8")
  );

  const files = await readdir(executionPath, { withFileTypes: true });
  const [responseFile] = files.filter(
    (file) => file.name !== "meta.json" && file.name.endsWith(".json")
  );

  const { chat } = superjson.parse(
    await readFile(path.resolve(responseFile.path, responseFile.name), "utf-8")
  ) as ExecutionChatResult;

  return "response" in chat ? [prompt, chat.response.choices[0].message] : [];
}

const formatError = (error: any) => ({
  data: error instanceof Error ? error : String(error),
  ...("stack" in error ? { stack: error.stack } : undefined),
});

const outputResult = (
  executionPath: string,
  result: Omit<ExecutionChatResult | ExecutionErrorResult, "executionId">
) =>
  writeFile(
    path.resolve(executionPath, `${new Date().toISOString()}.json`),
    superjson.stringify(result)
  );
