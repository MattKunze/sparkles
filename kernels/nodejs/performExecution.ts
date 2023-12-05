import * as esbuild from "esbuild";
import { readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import superjson from "superjson";
import vm from "node:vm";

const require = createRequire(import.meta.url);

export async function performExecution(filename: string) {
  try {
    const content = await readFile(filename, "utf-8");
    const transformed = await esbuild.transform(content, {
      format: "cjs",
      sourcemap: true,
    });

    const context = createContext();
    vm.runInNewContext(transformed.code, context);

    await writeFile(
      path.resolve(path.dirname(filename), "output.json"),
      superjson.stringify({ ...context.module.exports })
    );
  } catch (e) {
    console.error(e);
  }
}

function createContext() {
  return {
    ...global,
    Date,
    console,
    require,
    module: { exports: {} },
  };
}
