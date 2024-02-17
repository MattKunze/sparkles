import clsx from "clsx";
import { useCopyToClipboard } from "@uidotdev/usehooks";

import { CheckCircle } from "@/components/icons/CheckCircle";
import { ExclamationCircle } from "@/components/icons/ExclamationCircle";
import { SquareStack } from "@/components/icons/SquareStack";
import { useToastContext } from "@/components/organisms/ToastContext";
import {
  ExecutionMetaInfo,
  ExecutionDeferredResult,
  ExecutionResult,
} from "@/types";
import { formatDuration } from "@/utils/format";

import { ErrorDetails } from "./ErrorDetails";
import { Exports } from "./Exports";
import { Logs } from "./Logs";
import { Visualizations } from "./Visualizations";

export type CellExecutionResults = ExecutionMetaInfo & (ExecutionResult | {});

type Props = {
  result: CellExecutionResults;
  isStale: boolean;
};
export function CellResult(props: Props) {
  const { result } = props;

  const { showToast } = useToastContext();
  const [, copyToClipboard] = useCopyToClipboard();

  const queueDuration = result.executeTimestamp
    ? result.executeTimestamp.getTime() - result.createTimestamp.getTime()
    : undefined;

  const executeDuration =
    "success" in result
      ? result.success.duration
      : "error" in result
        ? result.error.duration
        : undefined;

  return (
    <div className="flex flex-row group">
      <div className="flex flex-col mr-1">
        <button
          disabled
          className={clsx("btn btn-sm btn-ghost px-1", {
            "!bg-transparent": !props.isStale,
          })}
        >
          {"success" in result ? (
            <CheckCircle
              className={props.isStale ? "text-gray-500" : "text-green-500"}
            />
          ) : "error" in result ? (
            <ExclamationCircle
              className={props.isStale ? "text-gray-500" : "text-red-500"}
            />
          ) : (
            <span className="loading loading-spinner text-gray-500"></span>
          )}
        </button>
      </div>
      <div role="tablist" className="tabs tabs-lifted w-full relative">
        <div className="badge badge-ghost absolute top-1 right-0 ">
          ...{result.executionId.slice(-7)}
          <a
            className="cursor-pointer"
            onClick={() => {
              copyToClipboard(result.executionId);
              showToast({
                message: `Copied ${result.executionId}`,
                icon: true,
                delay: 1000,
              });
            }}
          >
            <SquareStack className="pl-1" />
          </a>
        </div>
        <input
          type="radio"
          name={result.executionId}
          role="tab"
          className="tab ml-5 whitespace-nowrap"
          aria-label={resultsLabel({ queueDuration, executeDuration })}
          defaultChecked
        />
        <div
          role="tabpanel"
          className="tab-content bg-base-100 border-base-300 rounded p-2"
        >
          {"success" in result ? (
            <Exports
              serializedExports={result.success.serializedExports}
              deferred={
                "deferred" in result
                  ? (result as ExecutionDeferredResult).deferred
                  : undefined
              }
            />
          ) : "error" in result ? (
            <ErrorDetails
              error={result.error.data}
              stack={result.error.stack}
            />
          ) : null}
        </div>

        <input
          type="radio"
          name={result.executionId}
          role="tab"
          className={clsx("tab", {
            invisible: !(
              "success" in result &&
              Object.keys(result.success.serializedExports).length > 0
            ),
          })}
          aria-label="Visualizations"
        />
        <div
          role="tabpanel"
          className="tab-content bg-base-100 border-base-300 rounded p-2"
        >
          {"success" in result &&
            Object.keys(result.success.serializedExports).length > 0 && (
              <Visualizations
                serializedExports={result.success.serializedExports}
              />
            )}
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
          className="tab-content bg-base-100 border-base-300 rounded p-2"
        >
          {"logs" in result && result.logs && (
            <Logs
              executionStart={result.executeTimestamp ?? result.createTimestamp}
              logs={result.logs}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function resultsLabel({
  queueDuration,
  executeDuration,
}: {
  queueDuration?: number;
  executeDuration?: number;
}) {
  const precision = "human";
  if (executeDuration !== undefined) {
    const f = `${formatDuration(executeDuration, precision)}`;
    if (queueDuration && queueDuration >= 1000) {
      return `${f} (Queued ${formatDuration(queueDuration, precision)})`;
    }
    return f;
  } else if (queueDuration !== undefined) {
    return `Queued ${formatDuration(queueDuration, precision)}`;
  }
  return "Queued";
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
