import { TRPCError } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import { IncomingMessage } from "http";
import { DefaultSession } from "next-auth";
import { getSession } from "next-auth/react";
import { DeepNonNullable, DeepRequired } from "ts-essentials";
import { WebSocket } from "ws";

// avoid defensive coding throughout the codebase for partial session/user info
export type Session = DeepNonNullable<DeepRequired<DefaultSession>>;

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
  if (!session || !session.user?.name) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return {
    session,
  } as { session: Session };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
