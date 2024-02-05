"use client";
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
  onUpdate: (content: string) => void;
  onAddBelow: () => void;
  onDelete: () => void;
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

  return (
    <>
      <div
        key={cell.id}
        className={clsx(
          "flex flex-col p-2 gap-2 ring-2 rounded ring-transparent",
          {
            "!ring-indigo-200":
              cellHighlight?.cellId === cell.id &&
              cellHighlight.key === "handle",
            "!ring-red-400":
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
          onAdd={onAddBelow}
          onDelete={onDelete}
          onHoverChange={(key, isHover) =>
            setCellHighlight(isHover ? { cellId: cell.id, key } : null)
          }
        />
      </div>
      <div
        className={clsx("mx-2 ring-1 rounded ring-transparent", {
          "!ring-green-400":
            cell.id === cellHighlight?.cellId && cellHighlight.key === "add",
        })}
      />
    </>
  );
}
