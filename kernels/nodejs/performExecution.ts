import * as esbuild from "esbuild";
import { readFile, writeFile } from "fs/promises";
import vm from "node:vm";
import path from "path";
import prettier from "prettier";
import superjson from "superjson";

import { ExecutionMetaInfo } from "@/types";

import { buildLinkedImports } from "./buildLinkedImports";
import { capturePromise } from "./capturePromise";
import { runHooked } from "./cls";
import { defaultExportPlugin } from "./defaultExportPlugin";
import { formatError } from "./formatError";
import { outputResult } from "./outputResult";
import { serializeResult } from "./serializeResult";

export async function performExecution(filename: string) {
  const executionPath = path.dirname(filename);
  const executionId = path.basename(executionPath);
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
      format: "esm",
      sourcemap: true,
    });

    const linkedImports = await buildLinkedImports(executionPath, meta);
    await writeFile(
      path.resolve(executionPath, "index.js"),
      linkedImports.concat(transformed.code).join("\n")
    );
    await writeFile(
      path.resolve(executionPath, "index.js.map"),
      transformed.map
    );

    const evaluationStart = new Date();
    const exports = await evaluate(executionId, executionPath);

    await outputResult(executionPath, {
      success: {
        duration: Date.now() - evaluationStart.getTime(),
        serializedExports: Object.entries(
          exports as Record<string, unknown>
        ).reduce(
          (acc, [key, value]) => {
            acc[key] = serializeResult(value);
            return acc;
          },
          {} as Record<string, string>
        ),
      },
    });

    meta.exportKeys = Object.keys(exports);
    await writeFile(metaPath, superjson.stringify(meta));

    for (const [key, value] of Object.entries(exports)) {
      if (value instanceof Promise) {
        capturePromise(executionPath, key, evaluationStart, value);
      }
    }
  } catch (error) {
    await outputResult(executionPath, {
      error: {
        duration: Date.now() - executionStart.getTime(),
        ...formatError(error),
      },
    });
  }
}

async function evaluate(executionId: string, executionPath: string) {
  return runHooked(executionId, async () => {
    const mod = new vm.SourceTextModule(`import "${executionPath}"`);

    await mod.link(linker);
    await mod.evaluate();

    return linkCache[executionPath].exports;
  });
}

const linkCache: Record<string, { exports: any; module: vm.SourceTextModule }> =
  {};
async function linker(
  specifier: string,
  referencingModule: vm.SourceTextModule
): Promise<vm.SourceTextModule> {
  if (linkCache[specifier]) {
    return linkCache[specifier].module;
  }

  const exports = await import(specifier);
  const exportNames = Object.keys(exports);

  const syntheticModule = new vm.SyntheticModule(
    exportNames,
    function () {
      exportNames.forEach((key) => {
        this.setExport(key, exports[key]);
      });
    },
    { context: referencingModule.context }
  );

  linkCache[specifier] = {
    exports,
    module: syntheticModule,
  };
  return syntheticModule;
}
