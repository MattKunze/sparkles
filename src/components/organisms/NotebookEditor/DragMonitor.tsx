"use client";
import { useDndMonitor } from "@dnd-kit/core";

import { TOP_PLACEHOLDER_ID } from "./TopPlaceholder";

type Props = {
  onMoveCell: (cellId: string, afterId?: string) => void;
};
export function DragMonitor(props: Props) {
  useDndMonitor({
    onDragEnd(event) {
      if (!event.over) {
        return;
      }

      const cellId = event.active.id as string;
      const afterId =
        event.over.id === TOP_PLACEHOLDER_ID
          ? undefined
          : (event.over.id as string);
      if (cellId !== afterId) {
        props.onMoveCell(cellId, afterId);
      }
    },
  });

  return null;
}
