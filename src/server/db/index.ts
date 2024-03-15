import { Draft, produce } from "immer";
import { sortBy } from "lodash";

import { Context } from "@/server/context";
import { createEmptyDocument, Environment, NotebookDocument } from "@/types";

import {
  getDb,
  makeDbKey,
  superjsonCreate,
  superjsonQuery,
  superjsonSelect,
  superjsonUpdate,
} from "./surreal";

const NOTEBOOK_TYPE = "notebook";
const ENVIRONMENT_TYPE = "environment";
const DocumentTypes = [NOTEBOOK_TYPE, ENVIRONMENT_TYPE] as const;
export type DocumentType = (typeof DocumentTypes)[number];

export async function checkAuthorization<
  T extends { id: string; owner: string },
>(ctx: Context, documentType: DocumentType, documentId: string, keys = ["*"]) {
  let [doc] = await superjsonQuery<T>(documentType, keys, {
    whereClause: "json.owner = $owner and id = $id",
    variables: {
      owner: ctx.session.user.email,
      id: makeDbKey(documentType, documentId),
    },
  });

  if (!doc) {
    throw new Error("Unauthorized");
  }

  return doc;
}

const DocumentInfoKeys = ["id", "name", "owner", "timestamp", "tags"] as const;
type DocumentInfo = Pick<NotebookDocument, (typeof DocumentInfoKeys)[number]>;

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
  return sortBy(results, (t) => t.name.toLocaleLowerCase());
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
  await checkAuthorization(ctx, NOTEBOOK_TYPE, id);

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

// todo - encrypt secrets
export async function getEnvironment(ctx: Context, id: string) {
  return checkAuthorization<Environment>(ctx, ENVIRONMENT_TYPE, id, ["*"]);
}
export async function getEnvironmentPriviledged(id: string) {
  const key = makeDbKey(ENVIRONMENT_TYPE, id);
  return await superjsonSelect<Environment>(key);
}

export async function getEnvironments(ctx: Context) {
  const results = await superjsonQuery<Environment>(ENVIRONMENT_TYPE, ["*"], {
    whereClause: "json.owner = $owner",
    variables: { owner: ctx.session.user.email },
  });
  return sortBy(results, "name");
}

export async function updateEnvironment(ctx: Context, env: Environment) {
  if (env.owner !== ctx.session.user.email) {
    throw new Error("Owner mismatch");
  }

  const key = makeDbKey(ENVIRONMENT_TYPE, env.id);

  // can't use checkAuthorization since we don't want to throw if not found
  let current = await superjsonSelect<Environment>(key);
  if (current && current.owner !== ctx.session.user.email) {
    throw new Error("Unauthorized");
  }

  await superjsonUpdate(key, env);
  return env;
}
export async function updateEnvironmentPriviledged(env: Environment) {
  const key = makeDbKey(ENVIRONMENT_TYPE, env.id);
  await superjsonUpdate(key, env);
  return env;
}

export async function deleteEnvironment(ctx: Context, id: string) {
  await checkAuthorization(ctx, ENVIRONMENT_TYPE, id);

  const db = await getDb();
  await db.delete(makeDbKey(ENVIRONMENT_TYPE, id));
}
