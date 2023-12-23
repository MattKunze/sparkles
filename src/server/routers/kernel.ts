import { observable } from "@trpc/server/observable";
import { z } from "zod";

import { getNotebookDocument } from "@/server/db";
import {
  deleteContainer,
  enqueueExecution,
  eventEmitter,
  listContainers,
  UPDATE_EVENT,
} from "@/server/kernel";
import { ExecutionResult } from "@/types";

import { procedure, router } from "../trpc";

export const kernelRouter = router({
  instances: procedure.query(listContainers),
  deleteInstance: procedure
    .input(z.string())
    .mutation(async (opts) => deleteContainer(opts.input)),
  evaluateCell: procedure
    .input(
      z.object({
        documentId: z.string(),
        cellId: z.string(),
      })
    )
    .mutation(async (opts) => {
      const { documentId, cellId } = opts.input;
      const current = await getNotebookDocument(documentId, {
        throwIfNotFound: true,
      });
      const pos = current.cells.findIndex((c) => c.id === cellId);
      if (pos < 0) {
        throw new Error("Cell not found");
      }

      return enqueueExecution(documentId, current.cells[pos]);
    }),
  executionUpdates: procedure.subscription(() =>
    observable<ExecutionResult>((emit) => {
      const onUpdate = (data: ExecutionResult) => {
        emit.next(data);
      };
      eventEmitter.on(UPDATE_EVENT, onUpdate);

      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        eventEmitter.off(UPDATE_EVENT, onUpdate);
      };
    })
  ),
});
