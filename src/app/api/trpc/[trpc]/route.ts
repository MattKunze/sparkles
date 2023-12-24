import {
  FetchCreateContextFnOptions,
  fetchRequestHandler,
} from "@trpc/server/adapters/fetch";

// import { Context, createContext } from "@/server/context";
import { appRouter } from "@/server/routers/_app";

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: function (_opts: FetchCreateContextFnOptions) {
      // todo with ssr
      return { session: null };
    },
  });
};

export { handler as GET, handler as POST };
