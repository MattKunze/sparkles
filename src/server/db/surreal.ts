import { deserialize, serialize } from "superjson";
import { Surreal } from "surrealdb.js";

let db: Surreal | undefined;

export async function getDb() {
  if (!db) {
    const {
      SURREALDB_ENDPOINT,
      SURREALDB_USERNAME,
      SURREALDB_PASSWORD,
      SURREALDB_DATABASE,
      SURREALDB_NAMESPACE,
    } = process.env;

    db = new Surreal();
    await db.connect(String(SURREALDB_ENDPOINT));
    await db.signin({
      username: String(SURREALDB_USERNAME),
      password: String(SURREALDB_PASSWORD),
    });
    console.info(`connected to ${SURREALDB_USERNAME}@${SURREALDB_ENDPOINT}`);
    await db.use({
      database: String(SURREALDB_DATABASE),
      namespace: String(SURREALDB_NAMESPACE),
    });
    console.info(
      `using database/namespace ${SURREALDB_DATABASE}/${SURREALDB_NAMESPACE}`
    );
  }
  return db;
}

export function makeDbKey(thing: string, id: string) {
  return `${thing}:⟨${id}⟩`;
}

type SuperJSONResult = ReturnType<typeof serialize> &
  // just to satisfy `select<T>` constraint
  Record<string, unknown>;

export async function superjsonSelect<T extends Record<string, unknown>>(
  key: string
) {
  const surreal = await getDb();

  let [serialized] = await surreal.select<SuperJSONResult>(key);
  if (serialized) {
    return deserialize(serialized) as T;
  } else {
    return undefined;
  }
}

export async function superjsonQuery<T extends Record<string, unknown>>(
  table: string,
  fields: string[],
  // don't love how this leaks superjson serialization details
  filter?: {
    whereClause: string;
    variables: Record<string, unknown>;
  }
): Promise<T[]> {
  const surreal = await getDb();

  const [result] = await surreal.query(
    `SELECT meta, ${fields
      .map((field) => `json.${field}`)
      .join(", ")} FROM ${table} ${
      filter ? `WHERE ${filter.whereClause}` : ""
    }`,
    filter?.variables
  );

  if (Array.isArray(result)) {
    return (result as SuperJSONResult[]).map(deserialize) as T[];
  } else {
    return [];
  }
}

export async function superjsonCreate(
  key: string,
  doc: Record<string, unknown>
) {
  const surreal = await getDb();

  const { json, meta } = serialize(doc);
  await surreal.create(key, { json, meta });
}

export async function superjsonUpdate(
  key: string,
  doc: Record<string, unknown>
) {
  const surreal = await getDb();

  const { json, meta } = serialize(doc);
  await surreal.update(key, { json, meta });
}
