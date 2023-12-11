import { appendFile } from "fs/promises";
import path from "path";

const logLevels = ["info", "log", "warn", "debug", "error"] as const;

export function captureConsole(outputPath: string) {
  // todo - queue and batch output
  const appendLog = (level: keyof Console, ...args: any[]) => {
    const line = [
      new Date().toISOString(),
      level.toUpperCase(),
      JSON.stringify(args),
      "\n",
    ].join(" ");
    const fileName = path.resolve(
      outputPath,
      `${new Date().toISOString()}.log`
    );
    appendFile(fileName, line);
  };

  // TODO - group and other fancy stuff?
  return logLevels.reduce((acc, level) => {
    acc[level] = appendLog.bind(null, level);
    return acc;
  }, {} as Console);
}
