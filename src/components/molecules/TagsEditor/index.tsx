import { ElementRef, useRef, useState } from "react";
import clsx from "clsx";

import { PlusCircle } from "@/components/icons/PlusCircle";
import { CompactTagsList } from "@/components/molecules/CompactTagsList";

type Props = {
  availableTags: readonly string[];
  tags: readonly string[];
  setTags: (tags: string[]) => void;
};

export function TagsEditor(props: Props) {
  const [newTag, setNewTag] = useState("");
  const dropdownRef = useRef<ElementRef<"details">>(null);

  const toggleTag = (tag: string, resetNew?: boolean) => {
    if (props.tags.includes(tag)) {
      props.setTags(props.tags.filter((t) => t !== tag));
    } else {
      props.setTags(props.tags.concat(tag));
    }

    if (resetNew) {
      setNewTag("");
    }
  };

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end">
      <summary
        className={clsx("btn btn-sm", {
          "text-neutral-content": !props.tags.length,
        })}
      >
        {props.tags.length ? (
          <CompactTagsList tags={props.tags} />
        ) : (
          "[no tags]"
        )}
      </summary>
      <div
        tabIndex={0}
        className="dropdown-content z-[1] card card-compact w-96 p-2 shadow bg-base-100"
      >
        <div className="card-body">
          <div className="flex flex-wrap gap-1">
            {props.availableTags.map((tag) => (
              <button
                key={tag}
                className={clsx("badge badge-outline", {
                  "badge-primary": props.tags.includes(tag),
                })}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="card-actions mt-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="create"
                className="input input-bordered input-sm w-full shrink-0"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    toggleTag(newTag, true);
                  }
                }}
              />
              <button
                className="absolute top-1 right-2"
                disabled={!newTag}
                onClick={() => toggleTag(newTag, true)}
              >
                <PlusCircle />
              </button>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
