import { TRPCError } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import { IncomingMessage } from "http";
import { getSession } from "next-auth/react";
import { WebSocket } from "ws";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (
  opts:
    | NodeHTTPCreateContextFnOptions<IncomingMessage, WebSocket>
    | trpcNext.CreateNextContextOptions
) => {
  const session = await getSession(opts);
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return {
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
