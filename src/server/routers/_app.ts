import { router } from "../trpc";
import { environmentRouter } from "./environment";
import { kernelRouter } from "./kernel";
import { notebookRouter } from "./notebook";

export const appRouter = router({
  environment: environmentRouter,
  kernel: kernelRouter,
  notebook: notebookRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
