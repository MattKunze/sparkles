export type LineInfo = {
  line: string;
  depth: number;
  pair?: number;
};

type OpenRegion = {
  pos: number;
  target: string;
  prefix: string;
};

export function parseFoldingRegions(lines: string[]): LineInfo[] {
  const stack: OpenRegion[] = [];

  const info: LineInfo[] = [];
  for (const [index, line] of lines.entries()) {
    info.push({
      line,
      depth: (line.match(/^\s+/)?.[0].length || 0) / 2,
    });
    if (line.endsWith("{") || line.endsWith("[")) {
      const prefix = line.match(/^\s+/)?.[0] || "";
      stack.push({
        pos: index,
        target: prefix + (line.endsWith("{") ? "}" : "]"),
        prefix,
      });
    }

    // see if this closes the current region
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
