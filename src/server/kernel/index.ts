import chokidar from "chokidar";
import Docker from "dockerode";
import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import superjson from "superjson";
import { ulid } from "ulid";

import { Context } from "@/server/context";
import { ExecutionMetaInfo, ExecutionResult, NotebookCell } from "@/types";

export const UPDATE_EVENT = "update";
export const eventEmitter = new EventEmitter();

const docker = new Docker();
const DockerImage = "repl-notebook:kernel-nodejs";

let workspaceRoot: string;

export function initialize() {
  workspaceRoot = String(process.env.EXECUTION_WORKSPACE);

  chokidar
    .watch(`${workspaceRoot}/**/*.(json|log)`, {
      ignoreInitial: true,
      ignored: /meta\.json$/,
    })
    .on("add", emitUpdate)
    .on("change", emitUpdate);
}

export async function listContainers(ctx: Context) {
  const list = await docker.listContainers();
  return list.filter(
    (t) =>
      "repl-notebook.owner" in t.Labels &&
      t.Labels["repl-notebook.owner"] === ctx.session.user.email
  );
}

export async function startContainer(ctx: Context, documentId: string) {
  const workspacePath = resolveWorkspacePath(documentId);
  await fs.mkdir(workspacePath, { recursive: true });

  console.info(`Starting container: ${documentId}`);
  const container = await docker.createContainer({
    Image: DockerImage,
    HostConfig: {
      Binds: [`${workspacePath}:/workspace`],
    },
    Labels: {
      "repl-notebook.kernel": "nodejs",
      "repl-notebook.owner": ctx.session.user.email,
      "repl-notebook.document": documentId,
    },
  });
  await container.start();
  return container;
}

export async function deleteContainer(ctx: Context, id: string) {
  const container = docker.getContainer(id);

  // todo - authorize

  // note we don't wait here so the mutation returns immediately
  container.stop().then(() => {
    container.remove();
  });
}

export async function findContainer(ctx: Context, documentId: string) {
  const containers = await listContainers(ctx);
  return containers.find(
    (t) =>
      t.Labels["repl-notebook.owners"] === ctx.session.user.email &&
      t.Labels["repl-notebook.document"] === documentId
  );
}

export async function enqueueExecution(
  ctx: Context,
  documentId: string,
  cell: NotebookCell
): Promise<ExecutionMetaInfo> {
  if (!(await findContainer(ctx, documentId))) {
    await startContainer(ctx, documentId);

    // do better :/
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const executionId = ulid();

  const executionPath = path.resolve(
    resolveWorkspacePath(documentId),
    executionId
  );
  await fs.mkdir(executionPath);

  const meta: ExecutionMetaInfo = {
    executionId,
    cellId: cell.id,
    timestamp: new Date(),
  };

  await fs.writeFile(
    path.resolve(executionPath, "meta.json"),
    superjson.stringify(meta)
  );
  await fs.writeFile(path.resolve(executionPath, "index.ts"), cell.content);

  return meta;
}

function resolveWorkspacePath(documentId: string) {
  return path.resolve(workspaceRoot, documentId);
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
