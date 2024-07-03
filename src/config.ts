import dotenv from "dotenv";
import { z } from "zod";

import { isServer } from "./utils/isServer";

dotenv.config();

const SharedConfig = z.preprocess(
  () => {
    if (isServer()) {
      return {};
    }

    const { origin } = window.location;
    const { hostname } = new URL(origin);
    return {
      WEB_ENDPOINT: origin,
      WSS_ENDPOINT: `ws://${hostname}:3001`,
    };
  },
  z.object({
    WEB_ENDPOINT: z.string().default("http://localhost:3000"),
    WSS_ENDPOINT: z.string().default("ws://localhost:3001"),
  })
);

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
  WORKSPACE_DOCKER_VOLUME: z.string().optional(),
});

export const sharedConfig = SharedConfig.parse(process.env);

let serverConfig: z.infer<typeof ServerConfig>;
try {
  serverConfig = ServerConfig.parse(process.env);
} catch (e) {
  if (isServer() && process.env.NEXT_IS_EXPORT_WORKER !== "true") {
    throw e;
  }
}
export { serverConfig };

const redactPatterns = [/KEY/, /PASSWORD/, /SECRET/];

export function logConfig(config: Record<string, unknown>) {
  for (const [key, value] of Object.entries(config)) {
    console.log(
      `${key}: ${
        redactPatterns.some((pattern) => pattern.test(key)) ? "REDACTED" : value
      }`
    );
  }
}
