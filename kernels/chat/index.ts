import chokidar from "chokidar";
import Queue from "queue";
import path from "path";
import yargs from "yargs";

import { executeChat } from "./executeChat";
import { loadConfig } from "./config";

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

const q = new Queue({
  autostart: true,
  concurrency: 1,
  timeout: 10 * 60 * 1000,
});

function enqueue(filename: string) {
  console.info(`Queuing job: ${filename}`);

  if (path.basename(filename) === ".env") {
    q.push(loadConfig.bind(null, filename));
  } else if (filename.endsWith(".prompt")) {
    q.push(executeChat.bind(null, filename));
  }
}

chokidar
  .watch(`${argv["watch-path"]}/**/*.prompt`, {
    ignoreInitial: true,
  })
  .on("add", enqueue)
  .on("change", enqueue);

chokidar
  .watch(`${argv["watch-path"]}/.env`)
  .on("add", enqueue)
  .on("change", enqueue);

console.info(`Watching path: ${argv["watch-path"]}`);
