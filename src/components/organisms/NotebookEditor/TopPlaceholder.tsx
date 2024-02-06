import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

import { HandleToolbar } from "./HandleToolbar";
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
      <HandleToolbar
        onAdd={props.onAdd}
        onHoverChange={(key, isHover) =>
          props.setCellHighlight(
            isHover ? { cellId: TOP_PLACEHOLDER_ID, key } : null
          )
        }
      />
      <div
        className={clsx("ring-1 rounded ring-transparent", {
          "!ring-purple-400": isOver,
          "!ring-green-400":
            props.cellHighlight?.cellId === TOP_PLACEHOLDER_ID &&
            props.cellHighlight.key === "add",
        })}
      />
    </div>
  );
}
