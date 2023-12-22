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
    if (!current || !current.includes(document.id)) {
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
    onSuccess: (data) => {
      setExecutionResults((prev) => ({
        ...prev,
        [data.cellId]: data,
      }));
    },
  });
  trpc.kernel.executionUpdates.useSubscription(undefined, {
    onData: (data) => {
      setExecutionResults((prev) => {
        const prevData = Object.values(prev).find(
          (t) => t.executionId === data.executionId
        );
        if (!prevData) {
          console.error("Unknown execution", data);
          return prev;
        }
        return {
          ...prev,
          [prevData.cellId]: mergeResults(prevData, data),
        };
      });
    },
  });

  return (
    <>
      <DocumentHeader document={document} />
      {document.cells.map((cell) => (
        <div key={cell.id} className="flex flex-col my-5 pr-3">
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
          {cell.id in executionResults && (
            <>
              <div className="h-2"></div>
              <CellResult result={executionResults[cell.id]} />
            </>
          )}
        </div>
      ))}
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
