import SuperJSON from "superjson";

export function isPromise(value: unknown): value is Promise<unknown> {
  return (
    value instanceof Promise || (value as any)?.constructor?.name === "Promise"
  );
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

export default SuperJSON;
