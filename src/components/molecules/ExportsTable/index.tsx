import { isEmpty } from "lodash";

import { ExecutionDeferredResult } from "@/types";
import { formatDuration } from "@/utils/format";

type Props = {
  data: Record<string, unknown>;
  deferred?: ExecutionDeferredResult["deferred"];
};
export function ExportsTable({ data, deferred }: Props) {
  if (isEmpty(data)) {
    return (
      <div className="alert">
        <span className="font-mono">Empty results</span>
      </div>
    );
  }
  return (
    <table className="table table-sm w-full">
      <tbody>
        {Object.entries(data).map(([key, value]) => {
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

function decodeResult(
  key: string,
  value: unknown,
  deferred?: ExecutionDeferredResult["deferred"]
): { formatted: string; type: string } {
  let formatted = JSON.stringify(value, null, 2);
  let type: string = typeof value;

  if (Array.isArray(value)) {
    type = "array";
  } else if (value instanceof Date) {
    type = "date";
  } else if (value instanceof Promise) {
    const d = deferred?.[key];
    if (d) {
      type = `${d.result} (${formatDuration(d.duration, "human")})`;
      formatted = decodeResult(key, d.data).formatted;
    } else {
      type = "promise";
      formatted = "<pending>";
    }
  } else if (value instanceof RegExp) {
    type = "regexp";
    formatted = value.toString();
  }
  return { formatted, type };
}
