import * as esbuild from "esbuild";
import { readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import prettier from "prettier";
import { parsers } from "prettier/plugins/typescript";
import superjson from "superjson";
import vm from "node:vm";

const require = createRequire(import.meta.url);

export async function performExecution(filename: string) {
  try {
    const content = await readFile(filename, "utf-8");
    const formatted = await prettier.format(content, {
      parser: "typescript",
      plugins: [defaultExportPlugin],
    });

    const transformed = await esbuild.transform(formatted, {
      format: "cjs",
      sourcemap: true,
    });

    const context = createContext();
    vm.runInNewContext(transformed.code, context);

    await writeFile(
      path.resolve(path.dirname(filename), "output.json"),
      superjson.stringify({
        result: "ok",
        ...context.module.exports,
      })
    );
  } catch (error) {
    console.error(error);
    await writeFile(
      path.resolve(path.dirname(filename), "output.json"),
      superjson.stringify({
        result: "error",
        error,
        ...(error instanceof Error ? { stack: error.stack } : undefined),
      })
    );
  }
}

const sharedTypes = {
  Date,
  Error,
  RegExp,
  Map,
  Set,
  URL,
};

function createContext() {
  return {
    ...global,
    ...sharedTypes,
    console,
    require,
    module: { exports: {} },
  };
}

const defaultExportPlugin: prettier.Plugin = {
  parsers: {
    typescript: {
      ...parsers.typescript,
      parse: (text, options) => {
        const ast = parsers.typescript.parse(text, options);

        // convert final expression to a default export if possible
        const finalStatement = ast.body[ast.body.length - 1];
        if (finalStatement.type === "ExpressionStatement") {
          finalStatement.type = "ExportDefaultDeclaration";
          finalStatement.exportKind = "value";
          finalStatement.declaration = finalStatement.expression;
          delete finalStatement.expression;
        }

        return ast;
      },
    },
  },
};
