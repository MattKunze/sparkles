import chokidar from "chokidar";
import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import superjson from "superjson";
import { ulid } from "ulid";

import {
  ExecutionResult,
  ExecutionResultBase,
  ExecutionResultError,
  ExecutionResultSuccess,
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
): Promise<ExecutionResult> {
  const executionId = ulid();

  await fs.mkdir(path.resolve(workspacePath, executionId));

  const meta: ExecutionResultBase = {
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
  const meta = superjson.parse(
    await fs.readFile(
      path.resolve(path.dirname(filename), "meta.json"),
      "utf-8"
    )
  ) as ExecutionResultBase;
  const raw = await fs.readFile(filename, "utf-8");

  const result = meta;

  switch (path.extname(filename)) {
    case ".json":
      {
        const duration = Date.now() - meta.timestamp.getTime();
        const data = superjson.parse(raw) as any;
        if (data.result === "ok") {
          (result as ExecutionResultSuccess).duration = duration;
          (result as ExecutionResultSuccess).data = data;
        } else if (data.result === "error") {
          (result as ExecutionResultError).duration = duration;
          (result as ExecutionResultError).error = data.error;
        }
      }
      break;
    case ".log": {
      // todo - only read new lines from log file
      result.logs = raw.split("\n").filter(Boolean).map(parseLogLine);
      break;
    }
  }

  eventEmitter.emit(UPDATE_EVENT, result);
}

const LOG_RE = /(?<timestamp>[.:\w-]+) (?<level>\w+) (?<args>.*)/;
const parseLogLine = (line: string) => {
  const { timestamp, level, args } = line.match(LOG_RE)?.groups ?? {};
  return {
    timestamp: new Date(timestamp),
    level,
    args: JSON.parse(args),
  };
};
