import { writeFile } from "fs/promises";
import path from "path";

import { NotebookCell, NotebookDocument } from "@/types";

export async function enqueueExecution(
  basePath: string,
  executionId: string,
  _document: NotebookDocument,
  cell: NotebookCell
) {
  const prompt = {
    role: "user",
    content: cell.content,
  };

  await writeFile(
    path.resolve(basePath, executionId, "raw.prompt"),
    JSON.stringify(prompt, null, 2)
  );
}
