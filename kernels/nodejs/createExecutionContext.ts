import vm from "node:vm";

import createRequire from "./contextRequire";

const sharedTypes = {
  Buffer,
  Date,
  Error,
  RegExp,
  Map,
  Promise,
  Set,
  URL,
};

const requireCache = {};

export function createExecutionContext(overrides: Record<string, unknown>) {
  const context = vm.createContext({
    ...global,
    ...sharedTypes,
    ...overrides,
    module: { exports: {} },
  });
  context.require = createRequire({
    dir: __dirname,
    context,
    cache: requireCache,
  });

  return context;
}
