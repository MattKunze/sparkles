import { Draft, produce } from "immer";
import { sortBy } from "lodash";

import { Context } from "@/server/context";
import { createEmptyDocument, NotebookDocument } from "@/types";

import {
  getDb,
  makeDbKey,
  superjsonCreate,
  superjsonSelect,
  superjsonUpdate,
} from "./surreal";

type DocumentInfo = Pick<
  NotebookDocument,
  "id" | "name" | "owner" | "timestamp"
>;
const DocummentInfoKeys = ["id", "name", "owner", "timestamp"];

const NOTEBOOK_TYPE = "notebook";
export async function getDocumentInfo(
  ctx: Context
): Promise<Array<DocumentInfo>> {
  const db = await getDb();
  // leaky superjson implementation details
  const [{ result }] = await db.query(
    `select ${DocummentInfoKeys.map((key) => `json.${key}`).join(
      ", "
    )} from ${NOTEBOOK_TYPE} where json.owner = $owner`,
    {
      owner: ctx.session.user.email,
    }
  );
  if (Array.isArray(result)) {
    return sortBy(
      result.map((row: any) => row.json as DocumentInfo),
      "name"
    );
  } else {
    return [];
  }
}

export async function getNotebookDocument(
  ctx: Context,
  nameOrId: string,
  { throwIfNotFound = false } = {}
): Promise<NotebookDocument> {
  let doc = await superjsonSelect<NotebookDocument>(
    makeDbKey(NOTEBOOK_TYPE, nameOrId)
  );

  if (!doc || doc.owner !== ctx.session.user.email) {
    if (throwIfNotFound) {
      throw new Error("Document not found");
    }
    doc = createEmptyDocument({
      name: nameOrId,
      owner: ctx.session.user.email,
    });
    await superjsonCreate(makeDbKey(NOTEBOOK_TYPE, doc.id), doc);
  }
  return doc;
}

export async function deleteNotebookDocument(ctx: Context, id: string) {
  const db = await getDb();
  await db.delete(makeDbKey(NOTEBOOK_TYPE, id));
}

export async function mutateNotebookDocument(
  ctx: Context,
  id: string,
  timestamp: Date,
  mutate: (current: Draft<NotebookDocument>) => void
): Promise<NotebookDocument> {
  const current = await getNotebookDocument(ctx, id, { throwIfNotFound: true });
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
