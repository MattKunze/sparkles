import { XMark } from "@/components/icons/XMark";

type Props = {
  pinned: string[];
  onRemove: (filter: string) => void;
};
export function PinnedFilters(props: Props) {
  return (
    <div className="flex flex-col gap-2 mx-2 mb-2">
      {props.pinned.map((filter) => (
        <div key={filter} className="badge badge-ghost flex gap-2">
          {filter}
          <button
            className="hover:text-gray-300"
            onClick={() => props.onRemove(filter)}
          >
            <XMark className="!w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
