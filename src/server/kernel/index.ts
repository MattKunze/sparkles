import chokidar from "chokidar";
import Docker from "dockerode";
import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import { rimraf } from "rimraf";
import superjson from "superjson";
import { ulid } from "ulid";

import { serverConfig } from "@/config";
import { Context } from "@/server/context";
import { getEnvironment } from "@/server/db";
import {
  ExecutionMetaInfo,
  ExecutionResult,
  NotebookCell,
  NotebookDocument,
} from "@/types";

import { enqueueExecution as enqueueChatExecution } from "./chat";
import { enqueueExecution as enqueueNodejsExecution } from "./nodejs";

export const UPDATE_EVENT = "update";
export const eventEmitter = new EventEmitter();

const docker = new Docker();
const DockerImage: Record<NotebookCell["language"], string | undefined> = {
  chat: "sparkles:kernel-chat",
  typescript: "sparkles:kernel-nodejs",
  markdown: undefined,
};

enum ContainerLabels {
  DOCUMENT = "sparkles.document",
  LANGUAGE = "sparkles.language",
  OWNER = "sparkles.owner",
}

export function initialize() {
  chokidar
    .watch(`${serverConfig.WORKSPACE_ROOT}/**/*.(json|log)`, {
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

async function startContainer(
  ctx: Context,
  document: NotebookDocument,
  language: NotebookCell["language"]
) {
  const workspacePath = resolveWorkspacePath(document.id);
  await fs.mkdir(workspacePath, { recursive: true });

  const containerWorkspace =
    serverConfig.WORKSPACE_DOCKER_VOLUME ??
    path.resolve(serverConfig.WORKSPACE_ROOT, document.id);
  console.info(`Starting container: ${document.id} (${containerWorkspace})`);
  const container = await docker.createContainer({
    Image: DockerImage[language],
    name: containerName(document),
    HostConfig: {
      Binds: [`${containerWorkspace}:/workspace`],
    },
    Labels: {
      [ContainerLabels.DOCUMENT]: document.id,
      [ContainerLabels.LANGUAGE]: language,
      [ContainerLabels.OWNER]: ctx.session.user.email,
    },
    // can't bind to execution subfolder until the following is released:
    // https://github.com/moby/moby/pull/45687
    // for now we bind the workpsace root and pass the subfolder to watch as
    // and environment variable
    Env: serverConfig.WORKSPACE_DOCKER_VOLUME
      ? [`WORKSPACE_ROOT=/workspace/${document.id}`]
      : undefined,
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

export async function findContainer(
  ctx: Context,
  documentId: string,
  language: NotebookCell["language"]
) {
  const containers = await listContainers(ctx);
  return containers.find(
    (t) =>
      t.Labels[ContainerLabels.OWNER] === ctx.session.user.email &&
      t.Labels[ContainerLabels.DOCUMENT] === documentId &&
      t.Labels[ContainerLabels.LANGUAGE] === language
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

export async function clearResults(
  _ctx: Context,
  documentId: string,
  cellId: string
) {
  // TODO - check authorization
  const documentPath = resolveWorkspacePath(documentId);
  try {
    await fs.stat(documentPath);
  } catch {
    return;
  }
  const files = await fs.readdir(documentPath, { withFileTypes: true });
  const executionIds = files
    .filter((file) => file.isDirectory() && file.name !== "node_modules")
    .map((file) => file.name)
    .sort();
  for (const executionId of executionIds) {
    const meta = superjson.parse(
      await fs.readFile(
        path.resolve(documentPath, executionId, "meta.json"),
        "utf-8"
      )
    ) as ExecutionMetaInfo;
    if (meta.cellId === cellId) {
      await rimraf(path.resolve(documentPath, executionId));
    }
  }
}

export async function enqueueExecution(
  ctx: Context,
  document: NotebookDocument,
  cellId: string,
  linkedExecutionIds?: string[]
): Promise<ExecutionMetaInfo> {
  const cell = document.cells.find((t) => t.id === cellId);
  if (!cell) {
    throw new Error("Cell not found");
  }

  const needsContainer = DockerImage[cell.language] !== undefined;
  if (
    needsContainer &&
    !(await findContainer(ctx, document.id, cell.language))
  ) {
    await startContainer(ctx, document, cell.language);

    // do better :/
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const executionId = ulid();
  const documentPath = resolveWorkspacePath(document.id);
  const executionPath = path.resolve(documentPath, executionId);
  await fs.mkdir(executionPath, { recursive: true });

  const meta: ExecutionMetaInfo = {
    executionId,
    documentId: document.id,
    cellId,
    language: cell.language,
    createTimestamp: new Date(),
    linkedExecutionIds,
  };

  await fs.writeFile(
    path.resolve(executionPath, "meta.json"),
    superjson.stringify(meta)
  );
  await updateEnvironment(ctx, document);

  switch (cell.language) {
    case "chat":
      await enqueueChatExecution(documentPath, executionId, document, cell);
      break;
    case "typescript":
      await enqueueNodejsExecution(documentPath, executionId, document, cell);
      break;
  }

  return meta;
}

function resolveWorkspacePath(documentId: string) {
  return path.resolve(serverConfig.WORKSPACE_ROOT, documentId);
}

async function updateEnvironment(ctx: Context, document: NotebookDocument) {
  const env = document.environmentId
    ? await getEnvironment(ctx, document.environmentId)
    : null;

  const content = env?.variables
    ? Object.entries(env.variables)
        .map(([key, value]) => `${key}=${value.value}`)
        .join("\n")
    : "";

  const filename = path.resolve(resolveWorkspacePath(document.id), ".env");
  await fs.writeFile(filename, content);
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

const containerName = (document: NotebookDocument) =>
  [
    document.id.slice(-7).toLocaleLowerCase(),
    document.name
      .toLocaleLowerCase()
      .replace(/ /g, "_")
      .replace(/[^0-9a-z-_]/g, ""),
  ].join("-");

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
