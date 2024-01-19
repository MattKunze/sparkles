import SuperJSON from "superjson";

export function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise;
}

SuperJSON.registerCustom<Promise<unknown>, string>(
  {
    isApplicable: isPromise,
    serialize: () => "",
    deserialize: () => Promise.resolve(),
  },
  "promise"
);

// needed for plain regular expressions created across vm boundary
SuperJSON.registerCustom<RegExp, string>(
  {
    isApplicable: (v): v is RegExp => v?.constructor?.name === "RegExp",
    serialize: (v) => v.toString(),
    deserialize: (v) => {
      const [, pattern, flags] = v.split("/");
      return new RegExp(pattern, flags);
    },
  },
  "regexp"
);

// hacking arround surrealdb types for now - this is deeply self-referential
class Timeout {}
SuperJSON.registerCustom<{}, string>(
  {
    isApplicable: (v): v is {} => v?.constructor?.name === "Timeout",
    serialize: (v) => "",
    deserialize: (v) => new Timeout() as {},
  },
  "surreal-timeout"
);

// this serializes named objects such that we rebuild POJOs but with the
// correct class/constructor name
// not pretty, but all the ugly stuff is pretty self-contained here
const CustomFactories: Record<string, new (values: unknown) => any> = {};
function createFactory(name: string) {
  const f = new Function("values", "Object.assign(this, values)");
  Object.defineProperty(f, "name", { value: name, writable: false });
  return f as new (values: unknown) => unknown;
}
const BuiltIns = [
  "Object",
  "Array",
  "Date",
  "RegExp",
  "Set",
  "Map",
  "URL",
  "Error",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
];
SuperJSON.registerCustom<{}, string>(
  {
    isApplicable: (v): v is {} =>
      typeof v === "object" &&
      v?.constructor?.name &&
      !("__typename" in v) &&
      !BuiltIns.includes(v.constructor.name),
    serialize: (v) =>
      SuperJSON.stringify({
        __typename: v.constructor.name,
        ...v,
      }),
    deserialize: (v) => {
      const { __typename, ...rest } = SuperJSON.parse<any>(v);
      if (!(__typename in CustomFactories)) {
        CustomFactories[__typename] = createFactory(__typename);
      }
      return new CustomFactories[__typename](rest);
    },
  },
  "named-object"
);

export default SuperJSON;
