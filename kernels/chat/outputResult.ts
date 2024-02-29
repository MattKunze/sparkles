import { writeFile } from "fs/promises";
import path from "path";
import superjson from "superjson";

import { ExecutionChatResult, ExecutionErrorResult } from "@/types/execution";

export const outputResult = (
  executionPath: string,
  result: Omit<ExecutionChatResult | ExecutionErrorResult, "executionId">
) =>
  writeFile(
    path.resolve(executionPath, `${new Date().toISOString()}.json`),
    superjson.stringify(result)
  );
