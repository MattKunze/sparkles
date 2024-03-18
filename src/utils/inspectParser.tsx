import clsx from "clsx";

type LineValueType =
  | "object-start"
  | "object-end"
  | "array-start"
  | "array-end"
  | "function"
  | "undefined"
  | "null"
  | "boolean"
  | "number"
  | "string"
  | "regexp"
  | "date"
  | "symbol"
  | "deferred"
  | "unknown";

type BaseLineInfo = {
  pos: number;
  raw: string;
  type: LineValueType;
  indent: string;
  content: string;
  trailing: string;
};

type PairedLineInfo = BaseLineInfo & {
  type: "object-start" | "object-end" | "array-start" | "array-end";
  pair: number;
};

type ValueLineInfo = BaseLineInfo & {
  type: Omit<LineValueType, PairedLineInfo["type"]>;
};

type PropertyLineInfo = (PairedLineInfo | ValueLineInfo) & {
  key: string;
};

type DeferredLineInfo = (PairedLineInfo | ValueLineInfo) & {
  status: string;
};

export type ParsedLineInfo =
  | PropertyLineInfo
  | DeferredLineInfo
  | PairedLineInfo
  | ValueLineInfo;

const Literals: Record<string, LineValueType> = {
  undefined: "undefined",
  null: "null",
  true: "boolean",
  false: "boolean",
  NaN: "number",
  Infinity: "number",
};

const ValueTests: Array<{
  type: LineValueType;
  test: (content: string) => boolean;
}> = [
  {
    type: "string",
    test: (content) =>
      content.startsWith("'") ||
      content.startsWith('"') ||
      content.startsWith("`"),
  },
  {
    type: "date",
    test: (content) => content.endsWith("Z"),
  },
  {
    type: "number",
    test: (content) =>
      (content[0] >= "0" && content[0] <= "9") || content.startsWith("-"),
  },
  {
    type: "regexp",
    test: (content) => content.startsWith("/"),
  },
  {
    type: "function",
    test: (content) =>
      content.startsWith("[Function") ||
      content.startsWith("[AsyncFunction") ||
      content.startsWith("[GeneratorFunction"),
  },
  {
    type: "symbol",
    test: (content) => content.startsWith("Symbol("),
  },
];

const LinePattern = /^(?<indent>\s*)(?<content>[\s\S]*?)(?<trailing>,)?$/u;

export function parseInspectRepresentation(raw: string): ParsedLineInfo[] {
  const lines = raw.split("\n");

  const openRegions: Array<{ pos: number; match: string }> = [];

  const info: ParsedLineInfo[] = [];
  for (const [pos, line] of lines.entries()) {
    let { indent, content, trailing } = line.match(LinePattern)!.groups!;

    const currentRegion = openRegions[openRegions.length - 1];
    const lineInfo = {
      pos,
      raw: line,
      type: "unknown",
      indent,
      content,
      trailing,
    };

    const colonPos = content.indexOf(":");
    if (
      colonPos > 0 &&
      currentRegion?.match === "}" &&
      !content.startsWith("at ") &&
      !content.slice(colonPos - 8).startsWith("Function:") &&
      !content.slice(colonPos - 5).startsWith("Error:")
    ) {
      (lineInfo as PropertyLineInfo).key = content.slice(0, colonPos);
      content = lineInfo.content = content.slice(colonPos + 2);
    }

    if (content.startsWith("<")) {
      const endPos = content.indexOf(">");
      (lineInfo as DeferredLineInfo).status = content.slice(1, endPos);
      content = lineInfo.content = content.slice(endPos + 2);
    }

    if (content.endsWith("{")) {
      openRegions.push({ pos, match: "}" });
      lineInfo.type = "object-start";
    } else if (content.endsWith("[")) {
      openRegions.push({ pos, match: "]" });
      lineInfo.type = "array-start";
    } else if (currentRegion && content === currentRegion.match) {
      lineInfo.type = currentRegion.match === "}" ? "object-end" : "array-end";
      (lineInfo as PairedLineInfo).pair = currentRegion.pos;
      (info[currentRegion.pos] as PairedLineInfo).pair = pos;
      openRegions.pop();
    } else if (content in Literals) {
      lineInfo.type = Literals[content];
    } else {
      const value = ValueTests.find(({ test }) => test(content));
      if (value) {
        lineInfo.type = value.type;
      }
    }

    info.push(lineInfo as ParsedLineInfo);
  }

  if (openRegions.length > 0) {
    console.warn("Found unmatched regions", openRegions);
  }

  return info;
}

export function renderLine(line: ParsedLineInfo): React.ReactNode[] {
  return [
    line.indent,
    "key" in line ? renderKey(line.key) : null,
    "status" in line ? renderDeferred(line.status) : null,
    renderValue(line.type, line.content),
    line.trailing,
  ];
}

const ColorMap: Record<LineValueType, string> = {
  "object-start": "text-blue-500",
  "object-end": "",
  "array-start": "",
  "array-end": "",
  function: "text-emerald-500",
  undefined: "text-gray-400",
  null: "text-gray-700",
  boolean: "text-yellow-500",
  number: "text-yellow-500",
  string: "text-green-500",
  regexp: "text-red-500",
  date: "text-purple-500",
  symbol: "text-cyan-500",
  deferred: "",
  unknown: "",
};

function renderKey(key: PropertyLineInfo["key"]): React.ReactNode {
  if (key.startsWith("[Symbol")) {
    return [
      "[",
      <span key="k" className={ColorMap["symbol"]}>
        {key.slice(1, -1)}
      </span>,
      "]: ",
    ];
  } else {
    return <span key="k">{key}: </span>;
  }
}

function renderDeferred(status: DeferredLineInfo["status"]): React.ReactNode {
  return [
    "<",
    <span
      key="d"
      className={clsx({
        "text-pink-500": status === "pending",
        "text-green-500": status.startsWith("resolved"),
        "text-red-500": status.startsWith("rejected"),
      })}
    >
      {status}
    </span>,
    "> ",
  ];
}

function renderValue(type: LineValueType, value: string): React.ReactNode {
  if (type === "object-start") {
    return value.length > 2 ? (
      [
        <span key={`v_${type}`} className={ColorMap[type]}>
          {value.slice(0, -2)}
        </span>,
        " {",
      ]
    ) : (
      <span key={`v_${type}`}>{value}</span>
    );
  } else {
    return (
      <span key={`v_${type}`} className={ColorMap[type]}>
        {value}
      </span>
    );
  }
}

export function renderCollapsed(
  lineInfo: ParsedLineInfo[],
  pos: number
): React.ReactNode[] {
  const start = lineInfo[pos] as PairedLineInfo;
  const end = lineInfo[start.pair];
  return [
    ...renderLine(start),
    <span key="c" className="px-1 text-gray-500">
      ...
    </span>,
    ...renderLine({ ...end, indent: "" }),
  ];
}

export function toJSON<T = unknown>(info: ParsedLineInfo[]): T {
  const stack: T[] = [];

  for (const [_, entry] of info.entries()) {
    let value: unknown;
    let pushStack = false;
    switch (entry.type) {
      case "object-start":
        value = {};
        pushStack = true;
        break;
      case "array-start":
        value = [];
        pushStack = true;
        break;
      case "object-end":
      case "array-end":
        if (stack.length > 1) {
          stack.pop();
        }
        continue;
      case "undefined":
        value = undefined;
        break;
      case "null":
        value = null;
        break;
      case "boolean":
        value = entry.content === "true";
        break;
      case "number":
        value = parseFloat(entry.content);
        break;
      case "string":
        value = entry.content.slice(1, -1);
        break;
      case "regexp":
        const [, pattern, flags] = entry.content.split("/");
        value = new RegExp(pattern, flags);
        break;
      case "date":
        value = new Date(entry.content);
        break;
      // todo
      case "symbol":
      case "deferred":
        break;
    }

    const parent = stack[stack.length - 1];
    if (!parent || pushStack) {
      stack.push(value as T);
    }
    if (Array.isArray(parent)) {
      parent.push(value);
    } else if ("key" in entry) {
      if (!parent) {
        throw new Error("Invalid parent object");
      }
      (parent as Record<string, unknown>)[entry.key] = value;
    }
  }

  if (stack.length !== 1) {
    console.warn("Failed to resolve single value", stack);
  }

  return stack[0];
}
