"use client";
import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";

import { MagnifyingGlass } from "@/components/icons/MagnifyingGlass";
import { XMark } from "@/components/icons/XMark";

import { PinnedFilters } from "./PinnedFilters";

type Props = {
  pinned: string[];
  interval?: number;
  onSearch: (search: string) => void;
  updatePinned: (pinned: string[]) => void;
};

export default function SearchInput({
  pinned,
  interval = 100,
  onSearch,
  updatePinned,
}: Props) {
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, interval);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="">
      <div className="relative">
        <MagnifyingGlass className="absolute top-3 left-2" />
        <input
          type="text"
          placeholder="Search"
          className="input input-ghost w-full shrink-0 pl-10 focus:border-none focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              setSearch("");
              updatePinned([...pinned, search]);
            }
          }}
        />
        {search && (
          <div
            className="absolute top-4 right-2 cursor-pointer"
            onClick={() => setSearch("")}
          >
            <XMark className="h-4" />
          </div>
        )}
      </div>
      {pinned.length > 0 && (
        <PinnedFilters
          pinned={pinned}
          onRemove={(filter) =>
            updatePinned(pinned.filter((p) => p !== filter))
          }
        />
      )}
    </div>
  );
}
