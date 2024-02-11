import { useMemo, useState } from "react";
import clsx from "clsx";

import { ChevronDown } from "@/components/icons/ChevronDown";
import {
  ParsedLineInfo,
  renderCollapsed,
  renderLine,
} from "@/utils/inspectParser";

const MAX_INITIAL_LINES = 10;

type Props = {
  lineInfo: ParsedLineInfo[];
};
export function StructuredValue({ lineInfo }: Props) {
  const maxDepth = useMemo(
    () =>
      lineInfo.reduce((max, { indent }) => Math.max(max, indent.length / 2), 0),
    [lineInfo]
  );
  const [foldDepth, setFoldDepth] = useState(() =>
    lineInfo.length >= MAX_INITIAL_LINES ? Math.max(1, maxDepth - 1) : 0
  );
  const [collapsed, setCollapsed] = useState<Set<number>>(() => {
    if (foldDepth > 0) {
      return collapseAt(lineInfo, maxDepth - foldDepth);
    }
    return new Set();
  });

  const toggle = (pos: number) => {
    const update = new Set(collapsed);
    if (collapsed.has(pos)) {
      update.delete(pos);
    } else {
      update.add(pos);
    }
    setCollapsed(update);
    setFoldDepth(0);
  };

  let skipUntil: number | undefined = undefined;
  return (
    <div className="overflow-x-hidden">
      {(maxDepth > 1 || lineInfo.length >= MAX_INITIAL_LINES) && (
        <div className={rangeWidth(maxDepth)}>
          <input
            type="range"
            min={0}
            max={`${maxDepth}`}
            value={`${foldDepth}`}
            className="range range-primary range-xs max-w-xl"
            onChange={(e) => {
              const depth = parseInt(e.target.value, 10);
              setCollapsed(collapseAt(lineInfo, maxDepth - depth));
              setFoldDepth(depth);
            }}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        {lineInfo.map((entry, index) => {
          if (skipUntil !== undefined && index < skipUntil) {
            return null;
          }
          skipUntil = undefined;

          const isCollapsed = "pair" in entry && collapsed.has(index);
          if (isCollapsed) {
            skipUntil = entry.pair + 1;
          }

          return (
            <div key={index} className="flex items-center">
              <span className="w-6">
                {"pair" in entry && entry.pair > index && (
                  <span
                    className="text-gray-500 hover:text-gray-200 cursor-pointer"
                    onClick={() => toggle(index)}
                  >
                    <ChevronDown
                      className={clsx("!w-4 transition-transform", {
                        "transform -rotate-90": isCollapsed,
                      })}
                    />
                  </span>
                )}
              </span>
              <pre>
                {isCollapsed
                  ? renderCollapsed(lineInfo, index)
                  : renderLine(entry)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// tailwind optimizing compiler won't see dynamically computed names
const rangeWidth = (maxDepth: number) =>
  clsx({
    "w-10": maxDepth === 1,
    "w-20": maxDepth === 2,
    "w-30": maxDepth === 3,
    "w-40": maxDepth === 4,
    "w-50": maxDepth === 5,
    "w-60": maxDepth === 6,
    "w-70": maxDepth === 7,
    "w-80": maxDepth === 8,
    "w-90": maxDepth === 9,
  });

function collapseAt(lineInfo: ParsedLineInfo[], depth: number) {
  const set = new Set<number>();

  for (const [index, entry] of lineInfo.entries()) {
    if (
      "pair" in entry &&
      entry.pair > index &&
      entry.indent.length === depth * 2
    ) {
      set.add(index);
    }
  }

  return set;
}
