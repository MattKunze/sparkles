import { useMemo, useState } from "react";
import clsx from "clsx";

import { ChevronDown } from "@/components/icons/ChevronDown";

import { LineInfo, parseFoldingRegions } from "./folding";

const MAX_INITIAL_LINES = 10;

type Props = {
  value: string;
};
export function StructuredValue({ value }: Props) {
  const info = useMemo(() => parseFoldingRegions(value.split("\n")), [value]);

  const maxDepth = useMemo(
    () => info.reduce((max, { depth }) => Math.max(max, depth), 0),
    [info]
  );
  const [foldDepth, setFoldDepth] = useState(() =>
    info.length >= MAX_INITIAL_LINES ? Math.max(1, maxDepth - 1) : 0
  );
  const [collapsed, setCollapsed] = useState<Set<number>>(() => {
    if (foldDepth > 0) {
      return collapseAt(info, maxDepth - foldDepth);
    }
    return new Set();
  });

  const toggle = (index: number, info: LineInfo) => {
    const update = new Set(collapsed);
    if (collapsed.has(index)) {
      update.delete(index);
    } else {
      update.add(index);
    }
    setCollapsed(update);
    setFoldDepth(0);
  };

  let skipUntil: number | undefined = undefined;
  return (
    <div className="overflow-x-hidden">
      {(maxDepth > 1 || info.length >= MAX_INITIAL_LINES) && (
        <div className={rangeWidth(maxDepth)}>
          <input
            type="range"
            min={0}
            max={`${maxDepth}`}
            value={`${foldDepth}`}
            className="range range-primary range-xs max-w-xl"
            onChange={(e) => {
              const depth = parseInt(e.target.value, 10);
              setCollapsed(collapseAt(info, maxDepth - depth));
              setFoldDepth(depth);
            }}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        {info.map((entry, index) => {
          if (skipUntil !== undefined && index <= skipUntil) {
            return null;
          }
          skipUntil = undefined;

          const isCollapsed = collapsed.has(index);
          if (isCollapsed) {
            skipUntil = entry.pair;
          }

          return (
            <div key={index} className="flex items-center">
              <span className="w-6">
                {entry.pair !== undefined && entry.pair > index && (
                  <span
                    className="text-gray-500 hover:text-gray-200 cursor-pointer"
                    onClick={() => toggle(index, entry)}
                  >
                    <ChevronDown
                      className={clsx("w-4 transition-transform", {
                        "transform -rotate-90": isCollapsed,
                      })}
                    />
                  </span>
                )}
              </span>
              <pre>
                {entry.line}
                {isCollapsed && ` ... ${info[entry.pair!].line.trimStart()}`}
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

function collapseAt(info: LineInfo[], depth: number) {
  const set = new Set<number>();

  for (const [index, entry] of info.entries()) {
    if (depth === entry.depth && (entry.pair ?? 0) > index) {
      set.add(index);
    }
  }

  return set;
}
