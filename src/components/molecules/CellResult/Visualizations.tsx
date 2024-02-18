import { useMemo, useState } from "react";

import { ChevronDown } from "@/components/icons/ChevronDown";
import { ErrorBoundary } from "@/components/molecules/ErrorBoundary";
import { ChartStyle, NivoCharts } from "@/components/molecules/NivoCharts";
import { parseInspectRepresentation, toJSON } from "@/utils/inspectParser";

type Props = {
  serializedExports: Record<string, string>;
};
export function Visualizations(props: Props) {
  const exportKeys = Object.keys(props.serializedExports);
  const [selectedExport, setSelectedExport] = useState(
    "default" in props.serializedExports ? "default" : exportKeys[0]
  );

  const [chartStyle, setChartStyle] = useState<ChartStyle>("line");

  const value = props.serializedExports[selectedExport];
  const json = useMemo(
    () => toJSON(parseInspectRepresentation(value)),
    [value]
  );

  return (
    <div className="flex flex-col gap-2 p-2">
      <ul className="menu menu-horizontal bg-base-200 rounded-box w-full">
        <li className="dropdown">
          <div tabIndex={0} role="button" className="font-bold group">
            {selectedExport}
            <ChevronDown className="w-4 pl-1 group-focus:rotate-180" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            {exportKeys.map((key) => (
              <li key={key}>
                <a
                  onClick={() => {
                    setSelectedExport(key);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                >
                  {key}
                </a>
              </li>
            ))}
          </ul>
        </li>
        {(["line", "bar", "calendar"] as const).map((style) => (
          <li key={style}>
            <button
              className={style === chartStyle ? "active" : undefined}
              onClick={() => setChartStyle(style)}
            >
              {style}
            </button>
          </li>
        ))}
      </ul>
      {Array.isArray(json) ? (
        <ErrorBoundary>
          <NivoCharts style={chartStyle} data={json} />
        </ErrorBoundary>
      ) : (
        "unsupported data"
      )}
    </div>
  );
}
