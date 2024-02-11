import { useMemo } from "react";
import { useCopyToClipboard } from "@uidotdev/usehooks";

import { isEmpty, isEqual } from "lodash";

import { SquareStack } from "@/components/icons/SquareStack";
import { useToastContext } from "@/components/organisms/ToastContext";
import { ExecutionDeferredResult } from "@/types";
import { formatDuration } from "@/utils/format";
import { parseInspectRepresentation, toJSON } from "@/utils/inspectParser";

import { StructuredValue } from "./StructuredValue";

const EMPTY_EXPORTS = { default: "undefined" };

type Props = {
  serializedExports: Record<string, string>;
  deferred?: ExecutionDeferredResult["deferred"];
};
export function Exports({ serializedExports, deferred }: Props) {
  const { showToast } = useToastContext();
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopyToClipboard = (json: unknown) => {
    const formatted = JSON.stringify(json, null, 2);
    copyToClipboard(formatted);
    showToast({ message: "Copied!", delay: 1500 });
  };

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
        .flatMap(([key, value]) => {
          const deferredResult = deferred?.[key];
          const finalValue =
            deferredResult && value.includes("<pending>")
              ? replacePendingPlaceholder(value, deferredResult)
              : value;

          return (
            <ExportEntry
              key={key}
              label={key}
              value={finalValue}
              handleCopyToClipboard={handleCopyToClipboard}
            />
          );
        })}
    </div>
  );
}

function ExportEntry({
  label,
  value,
  handleCopyToClipboard,
}: {
  label: string;
  value: string;
  handleCopyToClipboard: (json: unknown) => void;
}) {
  const lineInfo = useMemo(() => parseInspectRepresentation(value), [value]);

  return [
    <div
      key={`k_${label}`}
      className="self-center font-mono font-bold flex items-center"
    >
      {label}
      <button
        className="inline-block pl-2 hover:text-gray-500"
        onClick={() => handleCopyToClipboard(toJSON(lineInfo))}
      >
        <SquareStack />
      </button>
    </div>,
    <StructuredValue key={`v_${label}`} lineInfo={lineInfo} />,
  ];
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
