"use client";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

import { CellEditor } from "@/components/molecules/CellEditor";
import {
  CellResult,
  CellExecutionResults,
} from "@/components/molecules/CellResult";
import { NotebookCell, NotebookDocument } from "@/types";

import { HandleToolbar } from "./HandleToolbar";
import { CellHighlight } from "./types";

type Props = {
  document: NotebookDocument;
  cell: NotebookCell;
  result: CellExecutionResults | undefined;
  cellHighlight: CellHighlight;
  setCellHighlight: (highlight: CellHighlight) => void;
  onEvaluate: () => void;
  onUpdate: (content: string, language?: NotebookCell["language"]) => void;
  onAddBelow: () => void;
  onDelete?: () => void;
};
export function CellSection({
  document,
  cell,
  result,
  cellHighlight,
  setCellHighlight,
  onEvaluate,
  onUpdate,
  onAddBelow,
  onDelete,
}: Props) {
  const pos = document.cells.findIndex((t) => t.id === cell.id);
  // todo - actually determine which previous cells are referenced
  const linkedCells = document.cells.slice(0, pos);

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({ id: cell.id });
  const {
    active,
    attributes,
    listeners,
    transform,
    setNodeRef: setDraggableRef,
  } = useDraggable({ id: cell.id });

  return (
    <>
      <div
        key={cell.id}
        ref={setDroppableRef}
        className={clsx(
          "flex flex-col p-2 gap-2 ring-2 rounded ring-transparent relative",
          {
            "opacity-50 bg-neutral-content": !!transform,
            "!ring-indigo-200":
              (isOver && transform) ||
              (!active &&
                cellHighlight?.cellId === cell.id &&
                cellHighlight.key === "handle"),
            "!ring-red-400":
              !active &&
              cellHighlight?.cellId === cell.id &&
              cellHighlight.key === "delete",
          }
        )}
      >
        <CellEditor cell={cell} onEvaluate={onEvaluate} onUpdate={onUpdate} />
        {result && (
          <CellResult
            result={result}
            isStale={linkedCells
              .concat(cell)
              .some((cell) => cell.timestamp > result.createTimestamp)}
          />
        )}
        <HandleToolbar
          disableHover={!!active}
          setDraggableRef={setDraggableRef}
          dragAttributes={attributes}
          dragListeners={listeners}
          onAdd={onAddBelow}
          onDelete={onDelete}
          onHoverChange={(key, isHover) =>
            setCellHighlight(isHover ? { cellId: cell.id, key } : null)
          }
        />
      </div>
      <div
        className={clsx("mx-2 ring-1 rounded ring-transparent", {
          "!ring-purple-400": isOver && !transform,
          "!ring-green-400":
            cell.id === cellHighlight?.cellId && cellHighlight.key === "add",
        })}
      />
    </>
  );
}
