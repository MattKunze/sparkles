import { readFile, writeFile } from "fs/promises";
import path from "path";

import { parsers } from "prettier/plugins/typescript";

import { NotebookCell, NotebookDocument } from "@/types";

export async function enqueueExecution(
  basePath: string,
  executionId: string,
  document: NotebookDocument,
  cell: NotebookCell
) {
  await updatePackageJson(basePath, document);
  await writeFile(path.resolve(basePath, executionId, "raw.ts"), cell.content);
}

async function updatePackageJson(basePath: string, document: NotebookDocument) {
  const dependencies = extractDependencies(document);

  const content = JSON.stringify(
    {
      type: "module",
      dependencies: dependencies.reduce(
        (acc, dep) => {
          acc[dep] = "latest";
          return acc;
        },
        {} as Record<string, string>
      ),
    },
    null,
    2
  );

  const filename = path.resolve(basePath, "package.json");

  // kernel listens to file changes to package.json so only write if changed -
  // this lets us skip the no-op `npm i`
  try {
    const current = await readFile(filename, "utf-8");
    if (current === content) {
      return;
    }
  } catch {}

  await writeFile(filename, content);
}

function extractDependencies(document: NotebookDocument) {
  return document.cells
    .filter((t) => t.language === "typescript")
    .reduce((acc, cell) => {
      try {
        const ast = parsers.typescript.parse(cell.content, {} as any);
        return acc.concat(
          ast.body
            .filter((t: any) => t.type === "ImportDeclaration")
            .map((node: any) => node.source.value)
        );
      } catch {}

      return acc;
    }, [] as string[])
    .sort();
}
