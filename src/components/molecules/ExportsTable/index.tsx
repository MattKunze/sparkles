import { isEmpty, isEqual } from "lodash";

import { ExecutionDeferredResult } from "@/types";
import { formatDuration } from "@/utils/format";

const EMPTY_EXPORTS = { default: "undefined" };

type Props = {
  serializedExports: Record<string, string>;
  deferred?: ExecutionDeferredResult["deferred"];
};
export function ExportsTable({ serializedExports, deferred }: Props) {
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
          .map(([key, value]) => (
            <tr key={key}>
              <th className="font-mono">{key}</th>
              <td className="w-full">
                <pre>{decodeResult(key, value as string, deferred)}</pre>
              </td>
            </tr>
          ))}
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
  value: string,
  deferred?: ExecutionDeferredResult["deferred"]
): string {
  const deferredResult = deferred?.[key];
  if (deferredResult) {
    // a little ugly to have to rewrite the pending placeholder in place
    const duration = formatDuration(deferredResult.duration, "human");
    return value.replace(
      "<pending>",
      `<${deferredResult.result} (${duration})> ${deferredResult.serialized}`
    );
  }
  return value;
}
