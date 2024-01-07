import { writeFile } from "fs/promises";
import path from "path";

import superjson from "./superjson";

import {
  ExecutionDeferredResult,
  ExecutionErrorResult,
  ExecutionSuccessResult,
} from "@/types/execution";

export const outputResult = (
  executionPath: string,
  result: Omit<
    ExecutionSuccessResult | ExecutionErrorResult | ExecutionDeferredResult,
    "executionId"
  >
) =>
  writeFile(
    path.resolve(executionPath, `${new Date().toISOString()}.json`),
    superjson.stringify(result)
  );
