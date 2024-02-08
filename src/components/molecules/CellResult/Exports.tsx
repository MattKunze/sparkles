import { isEmpty, isEqual } from "lodash";

import { ExecutionDeferredResult } from "@/types";
import { formatDuration } from "@/utils/format";

import { CollapsableValue } from "./CollapsableValue";

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
    <table className="table table-sm w-full">
      <tbody>
        {Object.entries(serializedExports)
          .sort(keySort)
          .map(([key, value]) => {
            const deferredResult = deferred?.[key];
            return (
              <tr key={key}>
                <th className="font-mono">{key}</th>
                <td className="w-full">
                  <CollapsableValue
                    value={
                      deferredResult && value.includes("<pending>")
                        ? replacePendingPlaceholder(value, deferredResult)
                        : value
                    }
                  />
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
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
