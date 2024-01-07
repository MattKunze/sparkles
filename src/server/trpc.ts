import { initTRPC } from "@trpc/server";

import superjson from "@/utils/superjson";

import { Context } from "./context";

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Base router and procedure helpers
export const middleware = t.middleware;
export const procedure = t.procedure;
export const router = t.router;
