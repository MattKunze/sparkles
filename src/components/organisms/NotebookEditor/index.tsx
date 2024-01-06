"use client";
import { useEffect, useState } from "react";

import { PlusCircle } from "@/components/icons/PlusCircle";
import { NotebookDocument } from "@/types";
import { trpc } from "@/utils/trpcClient";

import { CellEditor } from "../CellEditor";
import { CellResult, CellExecutionResults, mergeResults } from "../CellResult";
import { DocumentHeader } from "../DocumentHeader";

type Props = {
  document: NotebookDocument;
};
export function NotebookEditor(props: Props) {
  const utils = trpc.useContext();
  const [document, setDocument] = useState<NotebookDocument>(props.document);
  const [executionResults, setExecutionResults] = useState<
    Record<string, CellExecutionResults>
  >({});

  useEffect(() => {
    const current = utils.notebook.list.getData();
    // update list if document not found - this happens when creating a new
    // document automatically off a manually edited route
    if (!current || !current.find((t) => t.id === document.id)) {
      utils.notebook.list.invalidate();
    }
  }, [document.id, utils.notebook.list]);

  const addCell = trpc.notebook.addCell.useMutation({
    onSuccess: setDocument,
  });
  const deleteCell = trpc.notebook.deleteCell.useMutation({
    onSuccess: setDocument,
  });
  const updateCell = trpc.notebook.updateCell.useMutation({
    onSuccess: setDocument,
  });
  const evaluateCell = trpc.kernel.evaluateCell.useMutation({
    onMutate: (data) => {
      // seems like this should live server-side - this updates the cell
      // timestamp so dependent cells are marked as stale
      const cell = document.cells.find((t) => t.id === data.cellId);
      if (!cell) {
        return;
      }
      updateCell.mutate({
        documentId: document.id,
        documentTimestamp: document.timestamp,
        cellId: cell.id,
        content: cell.content,
      });
    },
    onSuccess: (data) => {
      setExecutionResults((prev) => ({
        ...prev,
        [data.cellId]: data,
      }));
    },
  });
  trpc.kernel.executionUpdates.useSubscription(
    { documentId: document.id },
    {
      onData: (data) => {
        setExecutionResults((prev) => {
          const prevData = Object.values(prev).find(
            (t) => t.executionId === data.executionId
          );
          if (!prevData) {
            if (data.documentId === document.id && data.cellId) {
              return {
                ...prev,
                [data.cellId]: data as CellExecutionResults,
              };
            }
            console.error("Unknown execution", data);
            return prev;
          }
          return {
            ...prev,
            [prevData.cellId]: mergeResults(prevData, data),
          };
        });
      },
    }
  );

  return (
    <>
      <DocumentHeader document={document} />
      {document.cells.map((cell) => {
        // todo - actually determine if prev cell is referenced
        const pos = document.cells.findIndex((t) => t.id === cell.id);
        const linkedCells = document.cells.slice(0, pos);

        const result = executionResults[cell.id];
        return (
          <div key={cell.id} className="flex flex-col my-5 pr-3 gap-2">
            <CellEditor
              cell={cell}
              onDelete={() =>
                deleteCell.mutate({
                  documentId: document.id,
                  documentTimestamp: document.timestamp,
                  cellId: cell.id,
                })
              }
              onEvaluate={() =>
                evaluateCell.mutate({
                  documentId: document.id,
                  cellId: cell.id,
                })
              }
              onUpdate={(content) =>
                updateCell.mutate({
                  documentId: document.id,
                  documentTimestamp: document.timestamp,
                  cellId: cell.id,
                  content,
                })
              }
            />
            {result && (
              <CellResult
                result={executionResults[cell.id]}
                isStale={linkedCells
                  .concat(cell)
                  .some((cell) => cell.timestamp > result.createTimestamp)}
              />
            )}
          </div>
        );
      })}
      <div className="flex flex-row justify-center">
        <button
          className="btn btn-primary btn-outline btn-sm px-10"
          onClick={() =>
            addCell.mutate({
              documentId: document.id,
              documentTimestamp: document.timestamp,
            })
          }
        >
          <PlusCircle />
        </button>
      </div>
    </>
  );
}
