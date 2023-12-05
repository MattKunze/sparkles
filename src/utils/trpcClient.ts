"use client";

import { createWSClient, wsLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { httpBatchLink, loggerLink } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/server/routers/_app";

import { createHydrateClient } from "./createHydrateClient";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

/*
 * Create a client that can be used in the client only
 */
export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: () => true,
        }),
        typeof window === "undefined"
          ? // use http for server side requests
            httpBatchLink({
              url: `${getBaseUrl()}/api/trpc`,
              // You can pass any HTTP headers you wish here
              async headers() {
                return {
                  // authorization: getAuthCookie(),
                };
              },
            })
          : // use web sockets for client side requests
            wsLink({
              client: createWSClient({
                url: `ws://localhost:${process.env.WSS_PORT ?? 3001}`,
              }),
            }),
      ],
      transformer: superjson,
    };
  },
  // queryClientConfig: {
  //   defaultOptions: {
  //     queries: {
  //       refetchOnWindowFocus: false,
  //       cacheTime: Infinity,
  //       staleTime: Infinity,
  //     },
  //   },
  // },
});

/*
 * A component used to hydrate the state from server to client
 */
export const HydrateClient = createHydrateClient({
  transformer: superjson,
});
