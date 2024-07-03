"use client";

import { createWSClient, wsLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { httpBatchLink, loggerLink } from "@trpc/react-query";
import superjson from "superjson";

import { logConfig, sharedConfig } from "@/config";
import type { AppRouter } from "@/server/routers/_app";

import { createHydrateClient } from "./createHydrateClient";

/*
 * Create a client that can be used in the client only
 */
export const trpc = createTRPCNext<AppRouter>({
  config() {
    logConfig(sharedConfig);
    return {
      links: [
        loggerLink({
          enabled: () => true,
        }),
        typeof window === "undefined"
          ? // use http for server side requests
            httpBatchLink({
              url: `${sharedConfig.WEB_ENDPOINT}/api/trpc`,
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
                url: sharedConfig.WSS_ENDPOINT,
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
