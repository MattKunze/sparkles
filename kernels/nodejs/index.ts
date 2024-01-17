import chokidar from "chokidar";
import Queue from "queue";
import yargs from "yargs";

import { captureConsole } from "./captureConsole";
import { installDependencies } from "./installDependencies";
import { performExecution } from "./performExecution";

const argv = yargs(process.argv.slice(2))
  .option("watch-path", {
    demandOption: true,
    alias: "w",
    description: "Specify the path to watch",
    type: "string",
  })
  .help()
  .alias("help", "h")
  .parseSync();

captureConsole(argv["watch-path"]);

const q = new Queue({
  autostart: true,
  concurrency: 1,
  timeout: 10 * 60 * 1000,
});

function enqueue(path: string) {
  console.info(`Enqueuing job: ${path}`);
  if (path.endsWith("package.json")) {
    q.push(installDependencies.bind(null, path));
  } else {
    q.push(performExecution.bind(null, path));
  }
}

chokidar
  .watch(`${argv["watch-path"]}/**/raw.ts`, {
    ignoreInitial: true,
  })
  .on("add", enqueue)
  .on("change", enqueue);

chokidar
  .watch(`${argv["watch-path"]}/package.json`)
  .on("add", enqueue)
  .on("change", enqueue);

console.info(`Watching path: ${argv["watch-path"]}`);
