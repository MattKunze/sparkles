import { spawn } from "node:child_process";
import path from "path";

export async function installDependencies(packageJson: string) {
  console.info(`Installing dependencies: ${packageJson}`);
  return new Promise((resolve, reject) => {
    const process = spawn("npm", ["install"], {
      cwd: path.dirname(packageJson),
    });

    process.stdout.on("data", (data) => {
      console.log(data instanceof Buffer ? data.toString("utf-8") : data);
    });
    process.stderr.on("data", (data) => {
      console.error(data instanceof Buffer ? data.toString("utf-8") : data);
    });

    process.on("close", (code) => {
      code ? reject(code) : resolve(code);
    });
  });
}
