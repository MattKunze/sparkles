import prettier from "prettier";
import prettierTypescript from "prettier/plugins/typescript";

export const defaultExportPlugin: prettier.Plugin = {
  parsers: {
    typescript: {
      ...prettierTypescript.parsers.typescript,
      parse: (text, options) => {
        const ast = prettierTypescript.parsers.typescript.parse(text, options);

        // convert final expression to a default export if possible
        const finalStatement = ast.body[ast.body.length - 1];
        if (finalStatement.type === "ExpressionStatement") {
          finalStatement.type = "ExportDefaultDeclaration";
          finalStatement.exportKind = "value";
          finalStatement.declaration = finalStatement.expression;
          delete finalStatement.expression;
        } else if (
          finalStatement.type === "VariableDeclaration" &&
          finalStatement.declarations.length === 1
        ) {
          // todo - hoist multiple final declarations to exports
          ast.body.pop();
          ast.body.push({
            type: "ExportNamedDeclaration",
            declaration: finalStatement,
            exportKind: "value",
          });
        }

        return ast;
      },
    },
  },
};
