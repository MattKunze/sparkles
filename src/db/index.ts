import { createEmptyDocument, NotebookDocument } from "@/types";

const db: Record<string, NotebookDocument> = {};

export async function getNotebookDocument(
  id: string
): Promise<NotebookDocument> {
  if (!db[id]) {
    db[id] = createEmptyDocument({ id });
  }
  return db[id];
}
