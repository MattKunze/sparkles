import * as esbuild from "esbuild";
import { readFile, writeFile } from "fs/promises";
import vm from "node:vm";
import path from "path";
import prettier from "prettier";
import superjson from "superjson";

import { ExecutionMetaInfo } from "@/types";

import { buildExecutionScript } from "./buildExecutionScript";
import { captureConsole } from "./captureConsole";
import { capturePromise } from "./capturePromise";
import { createExecutionContext } from "./createExecutionContext";
import { defaultExportPlugin } from "./defaultExportPlugin";
import { formatError } from "./formatError";
import { outputResult } from "./outputResult";

export async function performExecution(filename: string) {
  const executionPath = path.dirname(filename);
  const start = Date.now();

  console.info(`Executing job: ${filename}`);

  try {
    const metaPath = path.resolve(executionPath, "meta.json");
    const meta = superjson.parse(
      await readFile(metaPath, "utf-8")
    ) as ExecutionMetaInfo;
    meta.executeTimestamp = new Date();
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
    });
    vm.runInContext(await buildExecutionScript(executionPath, meta), context);

    await outputResult(executionPath, {
      success: {
        duration: Date.now() - start,
        data: context.module.exports,
      },
    });

    meta.exportKeys = Object.keys(context.module.exports);
    await writeFile(metaPath, superjson.stringify(meta));

    for (const [key, value] of Object.entries(context.module.exports)) {
      if (value instanceof Promise) {
        capturePromise(executionPath, key, start, value);
      }
    }
  } catch (error: any) {
    await outputResult(executionPath, {
      error: {
        duration: Date.now() - start,
        ...formatError(error),
      },
    });
  }
}
