import { Draft, produce } from "immer";

import { createEmptyDocument, NotebookDocument } from "@/types";

import {
  getDb,
  makeDbKey,
  superjsonCreate,
  superjsonSelect,
  superjsonUpdate,
} from "./surreal";

const NOTEBOOK_TYPE = "notebook";
export async function getDocumentIds() {
  const db = await getDb();
  // leaky superjson implementation details
  const [{ result }] = await db.query(`select json.id from ${NOTEBOOK_TYPE}`);
  if (Array.isArray(result)) {
    return result.map((row: any) => row.json.id).sort();
  } else {
    return [];
  }
}

export async function getNotebookDocument(
  id: string,
  { throwIfNotFound = false } = {}
): Promise<NotebookDocument> {
  const key = makeDbKey(NOTEBOOK_TYPE, id);
  let doc = await superjsonSelect<NotebookDocument>(key);

  if (!doc) {
    if (throwIfNotFound) {
      throw new Error("Document not found");
    }
    doc = createEmptyDocument({ id });
    await superjsonCreate(key, doc);
  }
  return doc;
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
  const key = makeDbKey("notebook", id);
  await superjsonUpdate(key, updated);
  return updated;
}
