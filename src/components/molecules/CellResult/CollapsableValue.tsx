import { useMemo, useState } from "react";
import clsx from "clsx";

import { ChevronDown } from "@/components/icons/ChevronDown";

type Props = {
  value: string;
};
export function CollapsableValue({ value }: Props) {
  const [collapsed, setCollapsed] = useState<Map<number, number>>(new Map());
  const info = useMemo(() => markFoldingRegions(value.split("\n")), [value]);

  const toggle = (index: number, info: LineInfo) => {
    const update = new Map(collapsed);
    if (collapsed.has(index)) {
      update.delete(index);
    } else {
      update.set(index, info.pair!);
    }
    setCollapsed(update);
  };

  let skipUntil: number | undefined = undefined;
  return (
    <>
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
    </>
  );
}

type LineInfo = {
  line: string;
  pair?: number;
};

type OpenRegion = {
  pos: number;
  target: string;
};

function markFoldingRegions(lines: string[]) {
  const stack: OpenRegion[] = [];

  const info = lines.map<LineInfo>((line) => ({ line }));

  for (let index = 0; index < info.length; index++) {
    const line = info[index].line;
    if (line.endsWith("{") || line.endsWith("[")) {
      const padding = line.match(/^\s+/)?.[0] || "";
      stack.push({
        pos: index,
        target: padding + (line.endsWith("{") ? "}" : "]"),
      });
    }

    const top = stack[stack.length - 1];
    if (line.replace(/,$/, "") === top?.target) {
      info[top.pos].pair = index;
      info[index].pair = top.pos;
      stack.pop();
    }
  }

  if (stack.length > 0) {
    console.warn("Found unmatched regions", stack, lines);
  }

  return info;
}
