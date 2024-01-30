import {
  FetchCreateContextFnOptions,
  fetchRequestHandler,
} from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { appRouter } from "@/server/routers/_app";
import { Session } from "@/server/context";

const handler = async (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async function (_opts: FetchCreateContextFnOptions) {
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new Error("Unauthorized");
      }
      return { session } as { session: Session };
    },
  });
};

export { handler as GET, handler as POST };
