import { readFile } from "fs/promises";
import path from "path";

import { ExecutionMetaInfo } from "@/types";

import superjson from "./superjson";

export async function buildExecutionScript(
  executionPath: string,
  meta: ExecutionMetaInfo
) {
  const lines: string[] = [];

  if (meta.linkedExecutionIds?.length) {
    for (const executionId of meta.linkedExecutionIds) {
      const basePath = path.resolve(executionPath, "..", executionId);
      const meta = superjson.parse(
        await readFile(path.resolve(basePath, "meta.json"), "utf-8")
      ) as ExecutionMetaInfo;

      const exportKeys = meta.exportKeys;
      if (exportKeys && Object.keys(exportKeys).length) {
        const defaultPos = exportKeys.indexOf("default");
        if (defaultPos >= 0) {
          exportKeys[defaultPos] = `default: _${executionId}`;
        }

        lines.push(
          `const { ${exportKeys.join(", ")} } = require("${basePath}");`
        );
      }
    }
  }

  lines.push(`module.exports = require("${executionPath}");`);

  return lines.join("\n");
}
