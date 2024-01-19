import { readFile } from "fs/promises";
import path from "path";
import superjson from "superjson";

import { ExecutionMetaInfo } from "@/types";

export async function buildLinkedImports(
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
          exportKeys[defaultPos] = `default as _${executionId}`;
        }

        lines.push(`import { ${exportKeys.join(", ")} } from "${basePath}";`);
      }
    }
  }

  return lines;
}
