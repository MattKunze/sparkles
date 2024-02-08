import { isEmpty, isEqual } from "lodash";

import { ExecutionDeferredResult } from "@/types";
import { formatDuration } from "@/utils/format";

import { StructuredValue } from "./StructuredValue";

const EMPTY_EXPORTS = { default: "undefined" };

type Props = {
  serializedExports: Record<string, string>;
  deferred?: ExecutionDeferredResult["deferred"];
};
export function Exports({ serializedExports, deferred }: Props) {
  if (isEmpty(serializedExports) || isEqual(serializedExports, EMPTY_EXPORTS)) {
    return (
      <div className="alert">
        <span className="font-mono">Empty results</span>
      </div>
    );
  }
  return (
    <div className="p-2 grid grid-cols-[minmax(75px,max-content)_1fr] gap-4 text-sm">
      {Object.entries(serializedExports)
        .sort(keySort)
        .flatMap(([key, value], index) => {
          const deferredResult = deferred?.[key];
          return [
            <div key={`k_${index}`} className="self-center font-mono font-bold">
              {key}
            </div>,
            <StructuredValue
              key={`v_${index}`}
              value={
                deferredResult && value.includes("<pending>")
                  ? replacePendingPlaceholder(value, deferredResult)
                  : value
              }
            />,
          ];
        })}
    </div>
  );
}

// sort "default" first, then alphabetically
function keySort([lhs]: [string, unknown], [rhs]: [string, unknown]) {
  if (lhs === "default") {
    return -1;
  } else if (rhs === "default") {
    return 1;
  } else return lhs.localeCompare(rhs);
}

/**
 * Promises get formatted like:
Promise {
  <pending>,
  [Symbol(async_id_symbol)]: 278824,
  [Symbol(trigger_async_id_symbol)]: 278747
}
 * replace the <pending> with the resolved/rejected value
 */
function replacePendingPlaceholder(
  value: string,
  deferredResult: ExecutionDeferredResult["deferred"][string]
) {
  const valueLines = value.split("\n");
  const pos = valueLines.findIndex((line) => line.includes("<pending>"));
  const padding = valueLines[pos].match(/^\s+/)?.[0] || "";

  // need to shift multiple lines of deferrd value by padding to line up
  const [first, ...rest] = deferredResult.serialized.split("\n");
  const deferredValue = [first, ...rest.map((line) => padding + line)].join(
    "\n"
  );

  const duration = formatDuration(deferredResult.duration, "human");
  valueLines[pos] =
    `${padding}<${deferredResult.result} (${duration})> ${deferredValue},`;

  return valueLines.join("\n");
}
