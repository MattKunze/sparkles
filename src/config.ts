import dotenv from "dotenv";
import { z } from "zod";

import { isServer } from "./utils/isServer";

dotenv.config();

const SharedConfig = z.object({
  WEB_ENDPOINT: z.string().default("http://localhost:3000"),
  WSS_ENDPOINT: z.string().default("ws://localhost:3001"),
});

const ServerConfig = z.object({
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string(),
  SURREALDB_ENDPOINT: z.string(),
  SURREALDB_USERNAME: z.string(),
  SURREALDB_PASSWORD: z.string(),
  SURREALDB_DATABASE: z.string(),
  SURREALDB_NAMESPACE: z.string(),
  WORKSPACE_ROOT: z.string(),
});

export const sharedConfig = SharedConfig.parse(process.env);

let serverConfig: z.infer<typeof ServerConfig>;
try {
  serverConfig = ServerConfig.parse(process.env);
} catch (e) {
  if (isServer()) {
    throw e;
  }
}
export { serverConfig };
