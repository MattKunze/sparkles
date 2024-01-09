import chokidar from "chokidar";
import Docker from "dockerode";
import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import { ulid } from "ulid";

import { Context } from "@/server/context";
import { ExecutionMetaInfo, ExecutionResult, NotebookDocument } from "@/types";
import superjson from "@/utils/superjson";

import { updatePackageJson } from "./nodejs";

export const UPDATE_EVENT = "update";
export const eventEmitter = new EventEmitter();

const docker = new Docker();
const DockerImage = "repl-notebook:kernel-nodejs";

enum ContainerLabels {
  DOCUMENT = "repl-notebook.document",
  IMAGE = "repl-notebook.kernel",
  OWNER = "repl-notebook.owner",
}

let workspaceRoot: string;
export function initialize() {
  workspaceRoot = String(process.env.EXECUTION_WORKSPACE);

  chokidar
    .watch(`${workspaceRoot}/**/*.(json|log)`, {
      ignoreInitial: true,
      ignored: [/node_modules/],
    })
    .on("add", emitUpdate)
    .on("change", emitUpdate);
}

export async function listContainers(ctx: Context) {
  const list = await docker.listContainers();
  return list.filter(
    (t) => t.Labels[ContainerLabels.OWNER] === ctx.session.user.email
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
      [ContainerLabels.IMAGE]: DockerImage.split(":")[1],
      [ContainerLabels.DOCUMENT]: documentId,
      [ContainerLabels.OWNER]: ctx.session.user.email,
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
      t.Labels[ContainerLabels.OWNER] === ctx.session.user.email &&
      t.Labels[ContainerLabels.DOCUMENT] === documentId
  );
}

export async function resolveLatestExecutionInfo(
  ctx: Context,
  documentId: string
) {
  // todo - checkAuthorization is throwing here on page load

  // first find most recent execution for each cell
  const documentPath = resolveWorkspacePath(documentId);
  try {
    await fs.stat(documentPath);
  } catch {
    return {};
  }
  const files = await fs.readdir(documentPath, { withFileTypes: true });
  const executionIds = files
    .filter((file) => file.isDirectory() && file.name !== "node_modules")
    .map((file) => file.name)
    .sort();
  const map: Record<string, ExecutionMetaInfo> = {};
  for (const executionId of executionIds) {
    const meta = superjson.parse(
      await fs.readFile(
        path.resolve(documentPath, executionId, "meta.json"),
        "utf-8"
      )
    ) as ExecutionMetaInfo;

    if (
      !map[meta.cellId] ||
      meta.createTimestamp > map[meta.cellId].createTimestamp
    ) {
      map[meta.cellId] = meta;
    }
  }

  return map;
}

export async function emitCurrentResults(ctx: Context, documentId: string) {
  const documentPath = resolveWorkspacePath(documentId);
  const executionInfo = await resolveLatestExecutionInfo(ctx, documentId);

  // then iterate executions and emit the cached updates -
  // might be nice to merge these and emit as a smaller number of updates
  Object.values(executionInfo).map(async (meta) => {
    const files = await fs.readdir(
      path.resolve(documentPath, meta.executionId),
      {
        withFileTypes: true,
      }
    );
    files.forEach((file) => {
      if (
        file.name !== "meta.json" &&
        (file.name.endsWith(".log") || file.name.endsWith(".json"))
      ) {
        emitUpdate(path.resolve(file.path, file.name), meta);
      }
    });
  });
}

export async function enqueueExecution(
  ctx: Context,
  document: NotebookDocument,
  cellId: string,
  linkedExecutionIds?: string[]
): Promise<ExecutionMetaInfo> {
  if (!(await findContainer(ctx, document.id))) {
    await startContainer(ctx, document.id);

    // do better :/
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const cell = document.cells.find((t) => t.id === cellId);
  if (!cell) {
    throw new Error("Cell not found");
  }

  const executionId = ulid();

  const documentPath = resolveWorkspacePath(document.id);
  const executionPath = path.resolve(documentPath, executionId);
  await fs.mkdir(executionPath, { recursive: true });

  updatePackageJson(documentPath, document);

  const meta: ExecutionMetaInfo = {
    executionId,
    documentId: document.id,
    cellId,
    createTimestamp: new Date(),
    linkedExecutionIds,
  };

  await fs.writeFile(
    path.resolve(executionPath, "meta.json"),
    superjson.stringify(meta)
  );
  await fs.writeFile(path.resolve(executionPath, "raw.ts"), cell.content);

  return meta;
}

function resolveWorkspacePath(documentId: string) {
  return path.resolve(workspaceRoot, documentId);
}

async function emitUpdate(filename: string, meta?: ExecutionMetaInfo) {
  const [documentId, executionId] = path
    .dirname(filename)
    .split(path.sep)
    .slice(-2);
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

  eventEmitter.emit(UPDATE_EVENT, documentId, { ...meta, ...result });
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
