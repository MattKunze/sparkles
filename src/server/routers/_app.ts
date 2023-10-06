import { z } from "zod";

import { procedure, router } from "../trpc";
import { notebookRouter } from "./notebook";

export const appRouter = router({
  hello: procedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
        timestamp: new Date(),
      };
    }),
  notebook: notebookRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
