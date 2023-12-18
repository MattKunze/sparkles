import chokidar from "chokidar";
import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import superjson from "superjson";
import { ulid } from "ulid";

import {
  ExecutionMetaInfo,
  ExecutionResult,
  ExecutionLogResult,
  NotebookCell,
} from "@/types";

export const UPDATE_EVENT = "update";
export const eventEmitter = new EventEmitter();

let workspacePath: string;

export function initialize() {
  workspacePath = String(process.env.EXECUTION_WORKSPACE);

  chokidar
    .watch(`${workspacePath}/**/*.(json|log)`, {
      ignoreInitial: true,
      ignored: /meta\.json$/,
    })
    .on("add", emitUpdate)
    .on("change", emitUpdate);
}

export async function enqueueExecution(
  cell: NotebookCell
): Promise<ExecutionMetaInfo> {
  const executionId = ulid();

  await fs.mkdir(path.resolve(workspacePath, executionId));

  const meta: ExecutionMetaInfo = {
    executionId,
    cellId: cell.id,
    timestamp: new Date(),
  };

  await fs.writeFile(
    path.resolve(workspacePath, executionId, "meta.json"),
    superjson.stringify(meta)
  );
  await fs.writeFile(
    path.resolve(workspacePath, executionId, "index.ts"),
    cell.content
  );

  return meta;
}

async function emitUpdate(filename: string) {
  const executionId = path.dirname(filename).split(path.sep).pop()!;
  const raw = await fs.readFile(filename, "utf-8");
  if (!raw) {
    console.error("Received empty update");
    return;
  }

  let result: ExecutionResult;

  switch (path.extname(filename)) {
    case ".json":
      {
        const json = superjson.parse(raw) as any;
        result = {
          executionId,
          ...json,
        };
      }
      break;
    case ".log": {
      result = {
        executionId,
        logs: parseLogResult(raw),
      };
      break;
    }
    default:
      throw new Error(`Unexpected file extension: ${path.extname(filename)}`);
  }

  eventEmitter.emit(UPDATE_EVENT, result);
}

const parseLogResult = (raw: string) =>
  raw.split("\n").filter(Boolean).map(parseLogLine);

const LOG_RE = /(?<timestamp>[.:\w-]+) (?<level>\w+) (?<args>.*)/;
const parseLogLine = (line: string) => {
  const { timestamp, level, args } = line.match(LOG_RE)?.groups ?? {};
  return {
    timestamp: new Date(timestamp),
    level,
    args: JSON.parse(args),
  };
};
