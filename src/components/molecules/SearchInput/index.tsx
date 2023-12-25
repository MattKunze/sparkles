"use client";
import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";

import { MagnifyingGlass } from "@/components/icons/MagnifyingGlass";
import { XMark } from "@/components/icons/XMark";

type Props = {
  interval?: number;
  onSearch: (search: string) => void;
};

export default function SearchInput(props: Props) {
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, props.interval || 100);

  useEffect(() => {
    props.onSearch(debouncedSearch);
  }, [debouncedSearch, props]);

  return (
    <div className="relative">
      <MagnifyingGlass className="absolute top-3 left-2" />
      <input
        type="text"
        placeholder="Search"
        className="input input-ghost w-full shrink-0 pl-10 focus:border-none focus:outline-none"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
  );
}
