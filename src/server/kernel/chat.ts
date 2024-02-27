import chokidar from "chokidar";
import dotenv from "dotenv";
import { readdir, readFile, writeFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import Queue from "queue";
import superjson from "superjson";
import util from "util";

import { serverConfig } from "@/config";
import {
  ExecutionErrorResult,
  ExecutionMetaInfo,
  ExecutionSuccessResult,
  NotebookCell,
  NotebookDocument,
} from "@/types";
import { parseInspectRepresentation, toJSON } from "@/utils/inspectParser";

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

    const response = await openai.chat.completions.create({
      model: "unused",
      messages,
    });

    await outputResult(executionPath, {
      success: {
        duration: Date.now() - start.getTime(),
        serializedExports: {
          response: serializeResult(response),
        },
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

  // need to munge REPL-formatted response to get the JSON object
  const {
    success: {
      serializedExports: { response: formattedResponse },
    },
  } = superjson.parse(
    await readFile(path.resolve(responseFile.path, responseFile.name), "utf-8")
  ) as ExecutionSuccessResult;
  const response = toJSON<OpenAI.ChatCompletion>(
    parseInspectRepresentation(formattedResponse)
  ).choices[0].message;

  return [prompt, response];
}

const serializeResult = (result: unknown) =>
  util.inspect(result, {
    compact: false,
    breakLength: Infinity,
    depth: null,
    maxArrayLength: null,
    maxStringLength: null,
  });

const formatError = (error: any) => ({
  data: error instanceof Error ? error : String(error),
  ...("stack" in error ? { stack: error.stack } : undefined),
});

const outputResult = (
  executionPath: string,
  result: Omit<ExecutionSuccessResult | ExecutionErrorResult, "executionId">
) =>
  writeFile(
    path.resolve(executionPath, `${new Date().toISOString()}.json`),
    superjson.stringify(result)
  );
