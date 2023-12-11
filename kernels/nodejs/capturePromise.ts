import { outputResult } from "./outputResult";
import process from "node:process";

// this prevents the app from crashing when a promise is rejected
process.on("unhandledRejection", () => {});

export function capturePromise(
  outputPath: string,
  exportKey: string,
  startTimestamp: number,
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
          duration: Date.now() - startTimestamp,
          data,
        },
      },
    });
  };

  promise.then(
    outputDeferredResult.bind(null, "resolved"),
    outputDeferredResult.bind(null, "rejected")
  );
}
