import { observable } from "@trpc/server/observable";
import { z } from "zod";

import { checkAuthorization, getNotebookDocument } from "@/server/db";
import {
  deleteContainer,
  emitCurrentResults,
  enqueueExecution,
  eventEmitter,
  listContainers,
  resolveLatestExecutionInfo,
  UPDATE_EVENT,
} from "@/server/kernel";
import { ExecutionMetaInfo, ExecutionResult } from "@/types";

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
      })
    )
    .mutation(async (opts) => {
      const { documentId, cellId } = opts.input;
      const document = await getNotebookDocument(opts.ctx, documentId, {
        throwIfNotFound: true,
      });

      const executionInfo = await resolveLatestExecutionInfo(
        opts.ctx,
        documentId
      );
      // todo - actually determine if cell is referenced
      const pos = document.cells.findIndex((t) => t.id === cellId);
      if (pos < 0) {
        throw new Error("Cell not found");
      }
      const linkedCells = document.cells
        .slice(0, pos)
        .filter((t) => t.language === document.cells[pos].language);
      const linkedExecutionIds = await linkedCells.reduce(
        async (prev, cell) => {
          const acc = await prev;
          const meta = executionInfo[cell.id];
          // enqueue execution if linked cell needs to be re-executed
          if (!meta || cell.timestamp > meta.createTimestamp) {
            const { executionId } = await enqueueExecution(
              opts.ctx,
              document,
              cell.id,
              acc
            );
            acc.push(executionId);
          } else {
            acc.push(meta.executionId);
          }
          return acc;
        },
        Promise.resolve([] as string[])
      );

      return enqueueExecution(opts.ctx, document, cellId, linkedExecutionIds);
    }),
  executionUpdates: procedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .subscription((opts) =>
      observable<ExecutionResult & Partial<ExecutionMetaInfo>>((emit) => {
        // can't use async auth check here so this seems the best alternative
        let authorized = false;
        checkAuthorization(opts.ctx, "notebook", opts.input.documentId)
          .then(() => {
            authorized = true;

            // broadcast most recent executions for document
            emitCurrentResults(opts.ctx, opts.input.documentId);
          })
          .catch(() => {
            console.error(
              `Unauthorized subscription: ${opts.input.documentId}`
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
