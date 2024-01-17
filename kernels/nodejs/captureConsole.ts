import { appendFile } from "fs/promises";
import path from "path";

import { getCurrentExecutionId } from "./cls";

const logLevels = ["info", "log", "warn", "debug", "error"] as const;

const VM_MODULES_WARNING =
  /ExperimentalWarning: VM Modules is an experimental feature/;

export function captureConsole(workspaceRoot: string) {
  const interceptLog = (
    level: keyof Console,
    orig: (...args: any[]) => void,
    ...args: any[]
  ) => {
    // ignore warnings about VM modules
    if (level === "error" && VM_MODULES_WARNING.test(args[0])) {
      return;
    }

    // todo - format, etc
    orig(...args);

    const executionId = getCurrentExecutionId();
    if (!executionId) {
      return;
    }

    // todo - queue and batch output
    const line = [
      new Date().toISOString(),
      level.toUpperCase(),
      JSON.stringify(args),
      "\n",
    ].join(" ");
    const fileName = path.resolve(
      workspaceRoot,
      executionId,
      `${new Date().toISOString()}.log`
    );
    appendFile(fileName, line);
  };

  // TODO - group and other fancy stuff?
  logLevels.reduce((acc, level) => {
    acc[level] = interceptLog.bind(null, level, console[level]);
    return acc;
  }, console);
}
