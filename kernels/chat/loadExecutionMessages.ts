import { readdir, readFile } from "fs/promises";
import path from "path";
import superjson from "superjson";

import { ExecutionChatResult } from "@/types";

export async function loadExecutionMessages(executionPath: string) {
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
