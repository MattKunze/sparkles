import { z } from "zod";

import {
  deleteNotebookDocument,
  getDocumentInfo,
  getNotebookDocument,
  mutateNotebookDocument,
} from "@/server/db";
import { clearResults, deleteContainer, findContainer } from "@/server/kernel";
import { procedure, router } from "@/server/trpc";
import { CellLanguages, createEmptyCell } from "@/types";

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
  rename: procedure
    .input(
      DocumentRef.extend({
        name: z.string(),
      })
    )
    .mutation((opts) =>
      mutateNotebookDocument(
        opts.ctx,
        opts.input.documentId,
        opts.input.documentTimestamp,
        (draft) => {
          draft.name = opts.input.name;
        }
      )
    ),
  setTags: procedure
    .input(
      DocumentRef.extend({
        tags: z.array(z.string()),
      })
    )
    .mutation((opts) =>
      mutateNotebookDocument(
        opts.ctx,
        opts.input.documentId,
        opts.input.documentTimestamp,
        (draft) => {
          draft.tags = opts.input.tags.sort();
        }
      )
    ),
  delete: procedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async (opts) => {
      await deleteNotebookDocument(opts.ctx, opts.input.id);

      // also destroy associated container
      const container = await findContainer(opts.ctx, opts.input.id);
      console.info({ documentId: opts.input.id, containerId: container?.Id });
      if (container) {
        await deleteContainer(opts.ctx, container.Id);
      }
    }),
  addCell: procedure
    .input(
      DocumentRef.extend({
        afterId: z.string().optional(),
        language: z.enum(CellLanguages).default("markdown"),
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
          draft.cells.splice(pos >= 0 ? pos + 1 : 0, 0, cell);
        }
      )
    ),
  updateCell: procedure
    .input(
      DocumentRef.extend({
        cellId: z.string(),
        language: z.enum(CellLanguages).optional(),
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
          if (opts.input.language) {
            draft.cells[pos].language = opts.input.language;
            clearResults(opts.ctx, opts.input.documentId, opts.input.cellId);
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
          draft.cells.splice(after >= 0 ? after + 1 : 0, 0, cell);
        }
      )
    ),
  selectEnvironment: procedure
    .input(
      DocumentRef.extend({
        environmentId: z.string().optional(),
      })
    )
    .mutation((opts) =>
      mutateNotebookDocument(
        opts.ctx,
        opts.input.documentId,
        opts.input.documentTimestamp,
        (draft) => {
          draft.environmentId = opts.input.environmentId;
        }
      )
    ),
});
