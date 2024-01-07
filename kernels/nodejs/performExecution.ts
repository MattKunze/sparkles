import * as esbuild from "esbuild";
import { readFile, writeFile } from "fs/promises";
import vm from "node:vm";
import path from "path";
import prettier from "prettier";

import { ExecutionMetaInfo } from "@/types";

import { buildExecutionScript } from "./buildExecutionScript";
import { captureConsole } from "./captureConsole";
import { capturePromise } from "./capturePromise";
import { createExecutionContext } from "./createExecutionContext";
import { defaultExportPlugin } from "./defaultExportPlugin";
import { formatError } from "./formatError";
import { outputResult } from "./outputResult";
import superjson, { isPromise } from "./superjson";

export async function performExecution(filename: string) {
  const executionPath = path.dirname(filename);
  const executionStart = new Date();

  console.info(`Executing job: ${filename}`);

  try {
    const metaPath = path.resolve(executionPath, "meta.json");
    const meta = superjson.parse(
      await readFile(metaPath, "utf-8")
    ) as ExecutionMetaInfo;
    meta.executeTimestamp = executionStart;
    await writeFile(metaPath, superjson.stringify(meta));

    const content = await readFile(filename, "utf-8");
    const formatted = await prettier.format(content, {
      parser: "typescript",
      plugins: [defaultExportPlugin],
    });

    const transformed = await esbuild.transform(formatted, {
      format: "cjs",
      sourcemap: true,
    });

    await writeFile(path.resolve(executionPath, "index.js"), transformed.code);
    await writeFile(
      path.resolve(executionPath, "index.js.map"),
      transformed.map
    );

    const context = createExecutionContext({
      console: captureConsole(executionPath),
      // todo - want to control the environment
      process,
    });
    const evaluationStart = new Date();
    vm.runInContext(await buildExecutionScript(executionPath, meta), context);

    await outputResult(executionPath, {
      success: {
        duration: Date.now() - evaluationStart.getTime(),
        data: { ...context.module.exports },
      },
    });

    meta.exportKeys = Object.keys(context.module.exports);
    await writeFile(metaPath, superjson.stringify(meta));

    for (const [key, value] of Object.entries(context.module.exports)) {
      if (isPromise(value)) {
        capturePromise(executionPath, key, evaluationStart, value);
      }
    }
  } catch (error: any) {
    await outputResult(executionPath, {
      error: {
        duration: Date.now() - executionStart.getTime(),
        ...formatError(error),
      },
    });
  }
}
