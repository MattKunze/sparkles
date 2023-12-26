import { observable } from "@trpc/server/observable";
import { z } from "zod";

import { checkAuthorization, getNotebookDocument } from "@/server/db";
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
  instances: procedure.query((opts) => listContainers(opts.ctx)),
  deleteInstance: procedure
    .input(z.string())
    .mutation(async (opts) => deleteContainer(opts.ctx, opts.input)),
  evaluateCell: procedure
    .input(
      z.object({
        documentId: z.string(),
        cellId: z.string(),
        linkedExecutionIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async (opts) => {
      const { documentId, cellId } = opts.input;
      const current = await getNotebookDocument(opts.ctx, documentId, {
        throwIfNotFound: true,
      });
      const pos = current.cells.findIndex((c) => c.id === cellId);
      if (pos < 0) {
        throw new Error("Cell not found");
      }

      return enqueueExecution(
        opts.ctx,
        documentId,
        current.cells[pos],
        opts.input.linkedExecutionIds
      );
    }),
  executionUpdates: procedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .subscription((opts) =>
      observable<ExecutionResult>((emit) => {
        // can't use async auth check here so this seems the best alternative
        let authorized = false;
        checkAuthorization(opts.ctx, opts.input.documentId)
          .then(() => {
            authorized = true;
          })
          .catch(() => {
            console.error(
              "Unauthorized subscription: ${opts.input.documentId}"
            );
          });

        const onUpdate = (updateDocumentId: string, data: ExecutionResult) => {
          if (authorized && updateDocumentId === opts.input.documentId) {
            emit.next(data);
          }
        };
        eventEmitter.on(UPDATE_EVENT, onUpdate);

        // unsubscribe function when client disconnects or stops subscribing
        return () => {
          eventEmitter.off(UPDATE_EVENT, onUpdate);
        };
      })
    ),
});
