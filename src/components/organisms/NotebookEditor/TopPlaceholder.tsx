import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

import { CellHighlight } from "./types";

export const TOP_PLACEHOLDER_ID = "__top__";

type Props = {
  cellHighlight: CellHighlight;
  setCellHighlight: (highlight: CellHighlight) => void;
  onAdd: () => void;
};
export function TopPlaceholder(props: Props) {
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: TOP_PLACEHOLDER_ID,
  });
  return (
    <div ref={setDroppableRef} className="flex flex-col p-2 gap-2">
      <div
        className={clsx("ring-1 rounded ring-transparent", {
          "!ring-purple-400": isOver,
        })}
      />
    </div>
  );
}
