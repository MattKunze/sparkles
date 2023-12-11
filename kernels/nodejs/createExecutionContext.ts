import { createRequire } from "module";

const sharedTypes = {
  Date,
  Error,
  RegExp,
  Map,
  Promise,
  Set,
  URL,
};

const require = createRequire(import.meta.url);

export function createExecutionContext(overrides: Record<string, unknown>) {
  return {
    ...global,
    ...sharedTypes,
    ...overrides,
    require,
    module: { exports: {} },
  };
}
