"use client";
import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";

import { MagnifyingGlass } from "@/components/icons/MagnifyingGlass";
import { XMark } from "@/components/icons/XMark";

import { PinnedFilters } from "./PinnedFilters";

type Props = {
  interval?: number;
  onSearch: (search: string[]) => void;
};

export default function SearchInput({ interval = 100, onSearch }: Props) {
  const [search, setSearch] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, interval);

  useEffect(() => {
    onSearch(pinned.concat(debouncedSearch));
  }, [debouncedSearch, pinned, onSearch]);

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
              setPinned([...pinned, search]);
              setSearch("");
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
          onRemove={(filter) => setPinned(pinned.filter((p) => p !== filter))}
        />
      )}
    </div>
  );
}
