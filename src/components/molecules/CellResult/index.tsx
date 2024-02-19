import { useState } from "react";
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

const Tabs = ["results", "visualizations", "logs"] as const;

type Props = {
  result: CellExecutionResults;
  isStale: boolean;
};
export function CellResult(props: Props) {
  const [activeTab, setActiveTab] = useState<(typeof Tabs)[number]>("results");
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

  const showVisualizations =
    "success" in result &&
    Object.keys(result.success.serializedExports).length > 0;
  const showLogs = "logs" in result && result.logs?.length;

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

      <div className="grid w-full relative">
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

        <div
          role="tablist"
          className="tabs tabs-lifted -mb-[var(--tab-border)] justify-self-start"
        >
          <a
            role="tab"
            className={clsx("tab ml-5", {
              "tab-active": activeTab === "results",
            })}
            onClick={() => setActiveTab("results")}
          >
            {resultsLabel({ queueDuration, executeDuration })}
          </a>
          {showVisualizations && (
            <a
              role="tab"
              className={clsx("tab", {
                "tab-active": activeTab === "visualizations",
              })}
              onClick={() => setActiveTab("visualizations")}
            >
              Visualizations
            </a>
          )}
          {showLogs && (
            <a
              role="tab"
              className={clsx("tab", {
                "tab-active": activeTab === "logs",
              })}
              onClick={() => setActiveTab("logs")}
            >
              Logs
              <span
                className={clsx("badge badge-ghost ml-1", {
                  "!badge-warning": result.logs.some(
                    (log) => log.level === "WARN"
                  ),
                  "!badge-error": result.logs.some(
                    (log) => log.level === "ERROR"
                  ),
                })}
              >
                {result.logs.length}
              </span>
            </a>
          )}
          <div className="tab [--tab-border-color:transparent]"></div>
        </div>

        <div role="tabpanel" className="bg-base-100 border rounded p-2">
          {activeTab === "results" && "success" in result ? (
            <Exports
              serializedExports={result.success.serializedExports}
              deferred={
                "deferred" in result
                  ? (result as ExecutionDeferredResult).deferred
                  : undefined
              }
            />
          ) : activeTab === "results" && "error" in result ? (
            <ErrorDetails
              error={result.error.data}
              stack={result.error.stack}
            />
          ) : activeTab === "visualizations" && showVisualizations ? (
            <Visualizations
              serializedExports={result.success.serializedExports}
            />
          ) : activeTab === "logs" && showLogs ? (
            <Logs
              executionStart={result.executeTimestamp ?? result.createTimestamp}
              logs={result.logs}
            />
          ) : null}
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
