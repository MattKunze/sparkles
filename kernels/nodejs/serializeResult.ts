import util from "util";

export function serializeResult(result: unknown) {
  return util.inspect(result, {
    compact: false,
    breakLength: Infinity,
    depth: null,
    maxArrayLength: null,
    maxStringLength: null,
  });
}
