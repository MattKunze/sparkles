export const ColorMap = {
  Null: "text-gray-700",
  Undefined: "text-gray-400",
  Boolean: "text-yellow-500",
  String: "text-emerald-500",
  Number: "text-yellow-500",
  Date: "text-purple-500",
  RegExp: "text-red-500",
  Function: "text-emerald-500",
  Object: "text-blue-500",
  Symbol: "text-cyan-500",
  Pending: "text-pink-500",
  Resolved: "text-green-500",
  Rejected: "text-red-500",
} as const;

// could probably combine these
const NamedObjectPattern =
  /^(?<prefix>\s*)(?<key>.+?: )?(?<name>\w*)(?<suffix> {$)/;
const PromiseResultPattern =
  /^(?<prefix>\s+)(?<deferred>\<(pending|resolved|rejected)( \(\w+\))?\>)( (?<value>.+?))?(?<suffix>,?)$/;
const ValuePattern = /^(?<prefix>\s*)(?<key>.+?: )?(?<value>.+?)(?<suffix>,?)$/;

// note this is very Node.js specific
export function syntaxHighlight(line: string): React.ReactNode {
  const objMatch = NamedObjectPattern.exec(line);
  if (objMatch?.groups) {
    return [
      objMatch.groups.prefix,
      highlightKey(objMatch.groups.key),
      <span key="name" className={ColorMap.Object}>
        {objMatch.groups.name}
      </span>,
      objMatch.groups.suffix,
    ];
  }

  const promiseMatch = PromiseResultPattern.exec(line);
  if (promiseMatch?.groups) {
    return [
      promiseMatch.groups.prefix,
      highlightDeferred(promiseMatch.groups.deferred),
      promiseMatch.groups.value ? " " : undefined,
      promiseMatch.groups.value
        ? [
            <span key="value" className={valueColor(promiseMatch.groups.value)}>
              {promiseMatch.groups.value}
            </span>,
          ]
        : undefined,
      promiseMatch.groups.suffix,
    ];
  }

  const valueMatch = ValuePattern.exec(line);
  if (valueMatch?.groups) {
    return [
      valueMatch.groups.prefix,
      highlightKey(valueMatch.groups.key),
      <span key="value" className={valueColor(valueMatch.groups.value)}>
        {valueMatch.groups.value}
      </span>,
      valueMatch.groups.suffix,
    ];
  }

  return line;
}

function highlightKey(key: string): React.ReactNode {
  if (key && key.startsWith("[") && key.endsWith("]: ")) {
    const t = key.slice(1, -3);
    return [
      "[",
      <span key="key" className={valueColor(t)}>
        {t}
      </span>,
      "]: ",
    ];
  } else {
    return key;
  }
}

function highlightDeferred(deferred: string): React.ReactNode {
  const className = deferred.startsWith("<pending")
    ? ColorMap.Pending
    : deferred.startsWith("<resolved")
      ? ColorMap.Resolved
      : ColorMap.Rejected;
  return <span className={className}>{deferred}</span>;
}

const StaticMap = {
  true: ColorMap.Boolean,
  false: ColorMap.Boolean,
  null: ColorMap.Null,
  undefined: ColorMap.Undefined,
  NaN: ColorMap.Number,
  Infinity: ColorMap.Number,
} as const;

function valueColor(value: string) {
  if (value in StaticMap) {
    return StaticMap[value as keyof typeof StaticMap];
  } else if (value.startsWith("'") || value.startsWith('"')) {
    return ColorMap.String;
  } else if (value.startsWith("/")) {
    return ColorMap.RegExp;
  } else if (value.endsWith("Z")) {
    return ColorMap.Date;
  } else if (value[0] >= "0" && value[0] <= "9") {
    return ColorMap.Number;
  } else if (value.startsWith("[Function")) {
    return ColorMap.Function;
  } else if (value.startsWith("Symbol")) {
    return ColorMap.Symbol;
  }
}
