import { ExecutionMetaInfo, ExecutionResult } from "@/types";

export type CellExecutionResults = ExecutionMetaInfo & Partial<ExecutionResult>;

type Props = {
  result: CellExecutionResults;
};
export function CellResult(props: Props) {
  return <pre>{JSON.stringify(props.result, null, 2)}</pre>;
}

export function mergeResults(
  current: CellExecutionResults,
  update: ExecutionResult
): CellExecutionResults {
  if ("logs" in update) {
    return {
      ...current,
      logs:
        "logs" in current && current.logs
          ? [...current.logs, ...update.logs]
          : update.logs,
    };
  }
  return {
    ...current,
    ...update,
  };
}
