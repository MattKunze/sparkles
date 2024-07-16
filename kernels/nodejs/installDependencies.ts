import { spawn } from "node:child_process";
import path from "path";

export async function installDependencies(packageJson: string) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    console.info(`Installing dependencies: ${packageJson}`);
    const process = spawn("pnpm", ["install"], {
      cwd: path.dirname(packageJson),
    });

    process.stdout.on("data", (data) => {
      console.log(data instanceof Buffer ? data.toString("utf-8") : data);
    });
    process.stderr.on("data", (data) => {
      console.error(data instanceof Buffer ? data.toString("utf-8") : data);
    });

    process.on("close", (code) => {
      console.info(`Dependencies updated in ${Date.now() - start}ms (${code})`);
      code ? reject(code) : resolve(code);
    });
  });
}
