import { EllipsisHorizontal } from "@/components/icons/EllipsisHorizontal";
import { PlusCircle } from "@/components/icons/PlusCircle";
import { XMark } from "@/components/icons/XMark";

type Props = {
  onAdd: () => void;
  onDelete?: () => void;
  onHoverChange: (key: "handle" | "add" | "delete", isHover: boolean) => void;
};
export function HandleToolbar(props: Props) {
  return (
    <div className="flex mr-6">
      <div className="grow basis-0">&nbsp;</div>
      <div className="grow basis-0 flex group gap-1">
        <button
          className="handle text-neutral-content hover:text-gray-500"
          onMouseEnter={() => props.onHoverChange("handle", true)}
          onMouseLeave={() => props.onHoverChange("handle", false)}
        >
          <EllipsisHorizontal />
        </button>
        <button
          className="text-neutral-content hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={props.onAdd}
          onMouseEnter={() => props.onHoverChange("add", true)}
          onMouseLeave={() => props.onHoverChange("add", false)}
        >
          <PlusCircle />
        </button>
        {props.onDelete && (
          <button
            className="text-neutral-content hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={props.onDelete}
            onMouseEnter={() => props.onHoverChange("delete", true)}
            onMouseLeave={() => props.onHoverChange("delete", false)}
          >
            <XMark />
          </button>
        )}
      </div>
    </div>
  );
}
