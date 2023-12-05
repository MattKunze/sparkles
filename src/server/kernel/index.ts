import chokidar from "chokidar";
import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import superjson from "superjson";
import { ulid } from "ulid";

import { ExecutionResult, ExecutionResultBase, NotebookCell } from "@/types";

export const UPDATE_EVENT = "update";
export const eventEmitter = new EventEmitter();

let workspacePath: string;

export function initialize() {
  workspacePath = String(process.env.EXECUTION_WORKSPACE);

  chokidar
    .watch(`${workspacePath}/**/*.json`, {
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
  const content = superjson.parse(await fs.readFile(filename, "utf-8"));

  const result: ExecutionResult = {
    ...meta,
    duration: Date.now() - meta.timestamp.getTime(),
    data: content,
  };
  eventEmitter.emit(UPDATE_EVENT, result);
}
