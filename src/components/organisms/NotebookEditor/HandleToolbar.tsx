import { useDraggable } from "@dnd-kit/core";
import clsx from "clsx";

import { EllipsisHorizontal } from "@/components/icons/EllipsisHorizontal";
import { PlusCircle } from "@/components/icons/PlusCircle";
import { XMark } from "@/components/icons/XMark";

const BaseClass = "text-neutral-content";
const HoverEnabledClass = "hover:text-gray-500 hidden group-hover:block";
const HoverDisabledClass = "hidden";

type Props = {
  disableHover?: boolean;
  setDraggableRef?: ReturnType<typeof useDraggable>["setNodeRef"];
  dragAttributes?: ReturnType<typeof useDraggable>["attributes"];
  dragListeners?: ReturnType<typeof useDraggable>["listeners"];
  onAdd: () => void;
  onDelete?: () => void;
  onHoverChange: (key: "handle" | "add" | "delete", isHover: boolean) => void;
};
export function HandleToolbar(props: Props) {
  return (
    <div
      ref={props.setDraggableRef}
      className="absolute -top-1 -right-1 flex bg-base-100 border px-px rounded hover:border-base-300 hover:border-2 hover:px-0"
    >
      <div className="grow basis-0 flex group gap-1">
        {props.onDelete && (
          <button
            className={clsx(
              BaseClass,
              props.disableHover ? HoverDisabledClass : HoverEnabledClass
            )}
            onClick={props.onDelete}
            onMouseEnter={() => props.onHoverChange("delete", true)}
            onMouseLeave={() => props.onHoverChange("delete", false)}
          >
            <XMark />
          </button>
        )}
        <button
          className={clsx(
            BaseClass,
            props.disableHover ? HoverDisabledClass : HoverEnabledClass
          )}
          onClick={props.onAdd}
          onMouseEnter={() => props.onHoverChange("add", true)}
          onMouseLeave={() => props.onHoverChange("add", false)}
        >
          <PlusCircle />
        </button>
        <button
          {...props.dragAttributes}
          {...props.dragListeners}
          className={BaseClass}
          onMouseEnter={() => props.onHoverChange("handle", true)}
          onMouseLeave={() => props.onHoverChange("handle", false)}
        >
          <EllipsisHorizontal />
        </button>
      </div>
    </div>
  );
}
