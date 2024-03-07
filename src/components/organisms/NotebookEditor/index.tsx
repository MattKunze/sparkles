"use client";
import { DndContext } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { omit } from "lodash";

import {
  CellExecutionResults,
  mergeResults,
} from "@/components/molecules/CellResult";
import { NotebookDocument } from "@/types";
import { trpc } from "@/utils/trpcClient";

import { CellSection } from "./CellSection";
import { DragMonitor } from "./DragMonitor";
import { DocumentHeader } from "./DocumentHeader";
import { TopPlaceholder } from "./TopPlaceholder";

type CellHighlight = { cellId: string; key: string } | null;
type Props = {
  document: NotebookDocument;
};
export function NotebookEditor(props: Props) {
  const utils = trpc.useContext();
  const [document, setDocument] = useState<NotebookDocument>(props.document);
  const [executionResults, setExecutionResults] = useState<
    Record<string, CellExecutionResults>
  >({});
  const [cellHighlight, setCellHighlight] = useState<CellHighlight>(null);

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
  const moveCell = trpc.notebook.moveCell.useMutation({
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
    <DndContext>
      <DragMonitor
        onMoveCell={(cellId, afterId) =>
          moveCell.mutate({
            documentId: document.id,
            documentTimestamp: document.timestamp,
            cellId,
            afterId,
          })
        }
      />
      <div className="flex flex-col gap-2">
        <div>
          <DocumentHeader document={document} onDocumentUpdate={setDocument} />
          <TopPlaceholder
            cellHighlight={cellHighlight}
            setCellHighlight={setCellHighlight}
            onAdd={() =>
              addCell.mutate({
                documentId: document.id,
                documentTimestamp: document.timestamp,
              })
            }
          />
        </div>
        {document.cells.map((cell) => (
          <CellSection
            key={cell.id}
            document={document}
            cell={cell}
            result={executionResults[cell.id]}
            cellHighlight={cellHighlight}
            setCellHighlight={setCellHighlight}
            onEvaluate={() =>
              evaluateCell.mutate({
                documentId: document.id,
                cellId: cell.id,
              })
            }
            onUpdate={(content, language) => {
              updateCell.mutate({
                documentId: document.id,
                documentTimestamp: document.timestamp,
                cellId: cell.id,
                language,
                content,
              });
              // clear results if language changes
              if (language) {
                setExecutionResults(omit(executionResults, cell.id));
              }
            }}
            onAddBelow={() =>
              addCell.mutate({
                documentId: document.id,
                documentTimestamp: document.timestamp,
                afterId: cell.id,
                language: cell.language,
              })
            }
            onDelete={
              document.cells.length > 1
                ? () =>
                    deleteCell.mutate({
                      documentId: document.id,
                      documentTimestamp: document.timestamp,
                      cellId: cell.id,
                    })
                : undefined
            }
          />
        ))}
      </div>
    </DndContext>
  );
}
