import { router } from "../trpc";
import { kernelRouter } from "./kernel";
import { notebookRouter } from "./notebook";

export const appRouter = router({
  kernel: kernelRouter,
  notebook: notebookRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
