import { outputResult } from "./outputResult";
import process from "node:process";

import { serializeResult } from "./serializeResult";

// this prevents the app from crashing when a promise is rejected
process.on("unhandledRejection", () => {});

export function capturePromise(
  outputPath: string,
  exportKey: string,
  executionStart: Date,
  promise: Promise<unknown>
) {
  const outputDeferredResult = (
    result: "resolved" | "rejected",
    data: unknown
  ) => {
    outputResult(outputPath, {
      deferred: {
        [exportKey]: {
          result,
          duration: Date.now() - executionStart.getTime(),
          serialized: serializeResult(data),
        },
      },
    });
  };

  promise.then(
    outputDeferredResult.bind(null, "resolved"),
    outputDeferredResult.bind(null, "rejected")
  );
}
