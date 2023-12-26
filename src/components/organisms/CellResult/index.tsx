import clsx from "clsx";

import { ChartBarSquare } from "@/components/icons/ChartBarSquare";
import { ErrorDetails } from "@/components/molecules/ErrorDetails";
import { ExportsTable } from "@/components/molecules/ExportsTable";
import { LogsTable } from "@/components/molecules/LogsTable";
import { ExecutionMetaInfo, ExecutionResult } from "@/types";

export type CellExecutionResults = ExecutionMetaInfo & (ExecutionResult | {});

type Props = {
  result: CellExecutionResults;
};
export function CellResult(props: Props) {
  const { result } = props;

  let resultsLabel = "Running";
  let resultsContent;
  if ("success" in result) {
    resultsLabel = `Success: ${result.success.duration}ms`;
    resultsContent = <ExportsTable data={result.success.data} />;
  } else if ("error" in result) {
    resultsLabel = `Error: ${result.error.duration}ms`;
    resultsContent = (
      <ErrorDetails error={result.error.data} stack={result.error.stack} />
    );
  }

  return (
    <div className="flex flex-row group">
      <div className="flex flex-col mr-1">
        <button className="btn btn-sm btn-accent btn-ghost mt-2 px-1">
          <ChartBarSquare />
        </button>
      </div>
      <div role="tablist" className="tabs tabs-lifted w-full relative">
        <div className="badge badge-ghost absolute top-1 right-0 ">
          ...{result.executionId.slice(-7)}
        </div>
        <input
          type="radio"
          name={result.executionId}
          role="tab"
          className="tab ml-5 whitespace-nowrap"
          aria-label={resultsLabel}
          defaultChecked
        />
        <div
          role="tabpanel"
          className="tab-content bg-base-100 border-base-300 rounded p-2"
        >
          {resultsContent}
        </div>

        <input
          type="radio"
          name={result.executionId}
          role="tab"
          className={clsx("tab", {
            invisible: !("logs" in result && result.logs?.length),
          })}
          aria-label="Logs"
        />
        <div
          role="tabpanel"
          className={clsx(
            "tab-content bg-base-100 border-base-300 rounded p-2",
            {
              invisible: !("logs" in result && result.logs?.length),
            }
          )}
        >
          {"logs" in result && result.logs && (
            <LogsTable executionStart={result.timestamp} logs={result.logs} />
          )}
        </div>
      </div>
    </div>
  );
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
