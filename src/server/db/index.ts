import { Draft, produce } from "immer";
import { sortBy } from "lodash";

import { Context } from "@/server/context";
import { createEmptyDocument, NotebookDocument } from "@/types";

import {
  getDb,
  makeDbKey,
  superjsonCreate,
  superjsonQuery,
  superjsonUpdate,
} from "./surreal";

type DocumentInfo = Pick<
  NotebookDocument,
  "id" | "name" | "owner" | "timestamp"
>;
const DocumentInfoKeys = ["id", "name", "owner", "timestamp"];

const NOTEBOOK_TYPE = "notebook";
export async function getDocumentInfo(
  ctx: Context
): Promise<Array<DocumentInfo>> {
  const results = await superjsonQuery<DocumentInfo>(
    NOTEBOOK_TYPE,
    DocumentInfoKeys,
    {
      whereClause: "json.owner = $owner",
      variables: { owner: ctx.session.user.email },
    }
  );
  return sortBy(results, "name");
}

export async function getNotebookDocument(
  ctx: Context,
  nameOrId: string,
  { throwIfNotFound = false } = {}
): Promise<NotebookDocument> {
  let [doc] = await superjsonQuery<NotebookDocument>(NOTEBOOK_TYPE, ["*"], {
    whereClause: "json.owner = $owner and (id = $id or json.name = $name)",
    variables: {
      owner: ctx.session.user.email,
      id: makeDbKey(NOTEBOOK_TYPE, nameOrId),
      name: nameOrId,
    },
  });

  if (!doc) {
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
  await checkAuthorization(ctx, id);

  const db = await getDb();
  await db.delete(makeDbKey(NOTEBOOK_TYPE, id));
}

export async function checkAuthorization(ctx: Context, documentId: string) {
  let [doc] = await superjsonQuery<NotebookDocument>(NOTEBOOK_TYPE, ["id"], {
    whereClause: "json.owner = $owner and id = $id",
    variables: {
      owner: ctx.session.user.email,
      id: makeDbKey(NOTEBOOK_TYPE, documentId),
    },
  });

  if (!doc) {
    throw new Error("Unauthorized");
  }

  return doc;
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
