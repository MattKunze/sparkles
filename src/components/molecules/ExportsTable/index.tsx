import { isEmpty, isEqual } from "lodash";

import { ExecutionDeferredResult } from "@/types";
import { formatDuration } from "@/utils/format";

const EMPTY_EXPORTS = { default: undefined };

type Props = {
  data: Record<string, unknown>;
  deferred?: ExecutionDeferredResult["deferred"];
};
export function ExportsTable({ data, deferred }: Props) {
  if (isEmpty(data) || isEqual(data, EMPTY_EXPORTS)) {
    return (
      <div className="alert">
        <span className="font-mono">Empty results</span>
      </div>
    );
  }
  return (
    <table className="table table-sm w-full">
      <tbody>
        {Object.entries(data)
          .sort(keySort)
          .map(([key, value]) => {
            const { formatted, type } = decodeResult(key, value, deferred);

            return (
              <tr key={key}>
                <th className="font-mono">{key}</th>
                <td className="w-full">
                  <pre>{formatted}</pre>
                </td>
                <td className="whitespace-nowrap">{type}</td>
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

function decodeResult(
  key: string,
  value: unknown,
  deferred?: ExecutionDeferredResult["deferred"]
): { formatted: string; type: string } {
  let formatted =
    value === undefined ? "undefined" : JSON.stringify(value, null, 2);
  let type: string =
    // intended double equals to catch undefined and null
    value == null ? formatted : value.constructor.name;

  if (value instanceof Promise) {
    const d = deferred?.[key];
    if (d) {
      type = `${d.result} (${formatDuration(d.duration, "human")})`;
      formatted = decodeResult(key, d.data).formatted;
    } else {
      formatted = "<pending>";
    }
  } else if (value instanceof RegExp) {
    formatted = value.toString();
  }
  return { formatted, type };
}
