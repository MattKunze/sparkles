import { ExecutionErrorResult } from "@/types/execution";

export function formatError(
  error: any
): Omit<ExecutionErrorResult["error"], "duration"> {
  return {
    data: error instanceof Error ? error : String(error),
    ...("stack" in error ? { stack: error.stack } : undefined),
  };
}
