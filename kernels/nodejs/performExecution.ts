import * as esbuild from "esbuild";
import { readFile } from "fs/promises";
import path from "path";
import prettier from "prettier";
import vm from "node:vm";

import { captureConsole } from "./captureConsole";
import { capturePromise } from "./capturePromise";
import { createExecutionContext } from "./createExecutionContext";
import { defaultExportPlugin } from "./defaultExportPlugin";
import { outputResult } from "./outputResult";

export async function performExecution(filename: string) {
  const executionPath = path.dirname(filename);
  const start = Date.now();

  console.info(`Executing job: ${filename}`);

  try {
    const content = await readFile(filename, "utf-8");
    const formatted = await prettier.format(content, {
      parser: "typescript",
      plugins: [defaultExportPlugin],
    });

    const transformed = await esbuild.transform(formatted, {
      format: "cjs",
      sourcemap: true,
    });

    const context = createExecutionContext({
      console: captureConsole(executionPath),
    });
    vm.runInNewContext(transformed.code, context);

    await outputResult(executionPath, {
      success: {
        duration: Date.now() - start,
        data: context.module.exports,
      },
    });

    for (const [key, value] of Object.entries(context.module.exports)) {
      if (value instanceof Promise) {
        capturePromise(executionPath, key, start, value);
      }
    }
  } catch (error) {
    console.error(error);
    await outputResult(executionPath, {
      error: {
        duration: Date.now() - start,
        data: formatError(error),
        ...(error instanceof Error ? { stack: error.stack } : undefined),
      },
    });
  }
}

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  return String(error);
};
