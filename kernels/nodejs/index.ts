import chokidar from "chokidar";
import Queue from "queue";
import yargs from "yargs";

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

const q = new Queue({
  autostart: true,
  concurrency: 1,
  timeout: 10 * 60 * 1000,
});

function enqueue(path: string) {
  q.push(performExecution.bind(null, path));
}

chokidar
  .watch(`${argv["watch-path"]}/**/*.ts`, { ignoreInitial: true })
  .on("add", enqueue)
  .on("change", enqueue);
