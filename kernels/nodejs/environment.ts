import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "path";

export async function parseEnv(executionPath: string) {
  try {
    const content = await readFile(
      path.resolve(executionPath, "../.env"),
      "utf-8"
    );
    return dotenv.parse(content);
  } catch {
    // likely no .env file
  }
  return {};
}

const PassthroughVariables = ["HOSTNAME"];

export function overrideEnv(env: Record<string, string>) {
  const originalEnv = process.env;
  process.env = Object.assign(
    PassthroughVariables.reduce<NodeJS.ProcessEnv>(
      (acc, key) => {
        acc[key] = originalEnv[key];
        return acc;
      },
      {
        NODE_ENV: originalEnv.NODE_ENV,
        NODE_VERSION: originalEnv.NODE_VERSION,
      }
    ),
    env
  );

  return () => {
    process.env = originalEnv;
  };
}
