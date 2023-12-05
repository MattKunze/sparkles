"use client";
import { useState } from "react";

import { ExecutionResult, NotebookDocument } from "@/types";
import { trpc } from "@/utils/trpcClient";

import { CellEditor } from "../CellEditor";
import { CellResult } from "../CellResult";

type Props = {
  document: NotebookDocument;
};
export function NotebookEditor(props: Props) {
  const [document, setDocument] = useState<NotebookDocument>(props.document);
  const [executionResults, setExecutionResults] = useState<
    Record<string, ExecutionResult>
  >({});

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
    onSuccess: (data) => {
      setExecutionResults((prev) => ({
        ...prev,
        [data.cellId]: data,
      }));
    },
  });
  trpc.kernel.executionUpdates.useSubscription(undefined, {
    onData: (data) => {
      setExecutionResults((prev) => ({
        ...prev,
        [data.cellId]: data,
      }));
    },
  });

  return (
    <>
      {document.cells.map((cell) => (
        <div key={cell.id} className="my-5">
          {cell.language === "typescript" && (
            <button
              className="btn btn-sm btn-accent"
              onClick={() =>
                evaluateCell.mutate({
                  documentId: document.id,
                  cellId: cell.id,
                })
              }
            >
              Run
            </button>
          )}
          <span className="badge badge-primary">{cell.language}</span>
          <span
            className="badge badge-ghost"
            onClick={() =>
              deleteCell.mutate({
                documentId: document.id,
                documentTimestamp: document.timestamp,
                cellId: cell.id,
              })
            }
          >
            {cell.id.slice(-6)}
          </span>
          <CellEditor
            cell={cell}
            onUpdate={(content) =>
              updateCell.mutate({
                documentId: document.id,
                documentTimestamp: document.timestamp,
                cellId: cell.id,
                content,
              })
            }
          />
          {cell.id in executionResults && (
            <CellResult result={executionResults[cell.id]} />
          )}
        </div>
      ))}
      <button
        className="btn btn-primary"
        onClick={() =>
          addCell.mutate({
            documentId: document.id,
            documentTimestamp: document.timestamp,
          })
        }
      >
        +
      </button>
    </>
  );
}
