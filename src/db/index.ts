import { Draft, produce } from "immer";

import { createEmptyDocument, NotebookDocument } from "@/types";

const db: Record<string, NotebookDocument> = {};

export async function getDocumentIds() {
  return Object.keys(db).sort();
}

export async function getNotebookDocument(
  id: string,
  { throwIfNotFound = false } = {}
): Promise<NotebookDocument> {
  if (!db[id]) {
    if (throwIfNotFound) {
      throw new Error("Document not found");
    }
    db[id] = createEmptyDocument({ id });
  }
  return db[id];
}

export async function mutateNotebookDocument(
  id: string,
  timestamp: Date,
  mutate: (current: Draft<NotebookDocument>) => void
): Promise<NotebookDocument> {
  const current = await getNotebookDocument(id, { throwIfNotFound: true });
  if (current.timestamp.getTime() !== timestamp.getTime()) {
    throw new Error(
      `Timestamp mismatch - ${current.timestamp.getTime()} !== ${timestamp.getTime()}`
    );
  }
  const updated = produce(current, (draft) => {
    mutate(draft);
    draft.timestamp = new Date();
  });
  db[id] = updated;
  return updated;
}
