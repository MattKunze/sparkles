import { z } from "zod";

import {
  deleteNotebookDocument,
  getDocumentInfo,
  getNotebookDocument,
  mutateNotebookDocument,
} from "@/server/db";
import { procedure, router } from "@/server/trpc";
import { createEmptyCell } from "@/types";

const DocumentRef = z.object({
  documentId: z.string(),
  documentTimestamp: z.date(),
});

export const notebookRouter = router({
  list: procedure.query((opts) => getDocumentInfo(opts.ctx)),
  get: procedure
    .input(
      z.object({
        nameOrId: z.string(),
      })
    )
    .query((opts) => getNotebookDocument(opts.ctx, opts.input.nameOrId)),
  delete: procedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation((opts) => deleteNotebookDocument(opts.ctx, opts.input.id)),
  addCell: procedure
    .input(
      DocumentRef.extend({
        afterId: z.string().optional(),
        language: z.enum(["markdown", "typescript"]).default("typescript"),
      })
    )
    .mutation((opts) =>
      mutateNotebookDocument(
        opts.ctx,
        opts.input.documentId,
        opts.input.documentTimestamp,
        (draft) => {
          const cell = createEmptyCell({ language: opts.input.language });
          const pos = draft.cells.findIndex((c) => c.id === opts.input.afterId);
          if (pos >= 0) {
            draft.cells.splice(pos + 1, 0, cell);
          } else {
            draft.cells.push(cell);
          }
        }
      )
    ),
  updateCell: procedure
    .input(
      DocumentRef.extend({
        cellId: z.string(),
        content: z.string(),
      })
    )
    .mutation((opts) =>
      mutateNotebookDocument(
        opts.ctx,
        opts.input.documentId,
        opts.input.documentTimestamp,
        (draft) => {
          const pos = draft.cells.findIndex((c) => c.id === opts.input.cellId);
          if (pos < 0) {
            throw new Error("Cell not found");
          }
          draft.cells[pos].content = opts.input.content;
          draft.cells[pos].timestamp = new Date();
        }
      )
    ),
  deleteCell: procedure
    .input(
      DocumentRef.extend({
        cellId: z.string(),
      })
    )
    .mutation((opts) =>
      mutateNotebookDocument(
        opts.ctx,
        opts.input.documentId,
        opts.input.documentTimestamp,
        (draft) => {
          const pos = draft.cells.findIndex((c) => c.id === opts.input.cellId);
          if (pos < 0) {
            throw new Error("Cell not found");
          }
          draft.cells.splice(pos, 1);
        }
      )
    ),
  moveCell: procedure
    .input(
      DocumentRef.extend({
        cellId: z.string(),
        afterId: z.string().optional(),
      })
    )
    .mutation((opts) =>
      mutateNotebookDocument(
        opts.ctx,
        opts.input.documentId,
        opts.input.documentTimestamp,
        (draft) => {
          const current = draft.cells.findIndex(
            (c) => c.id === opts.input.cellId
          );
          if (current < 0) {
            throw new Error("Cell not found");
          }
          const cell = draft.cells[current];
          draft.cells.splice(current, 1);
          const after = draft.cells.findIndex(
            (c) => c.id === opts.input.afterId
          );
          if (after >= 0) {
            draft.cells.splice(after + 1, 0, cell);
          } else {
            draft.cells.push(cell);
          }
        }
      )
    ),
});
