"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { PlusCircle } from "@/components/icons/PlusCircle";
import SearchInput from "@/components/molecules/SearchInput";
import { randomDocumentId } from "@/types";
import { trpc } from "@/utils/trpcClient";

export default function DocumentList() {
  const pathname = usePathname();
  const router = useRouter();
  const documents = trpc.notebook.list.useQuery();
  const [filter, setFilter] = useState("");

  let filteredDocuments = documents.data
    ? documents.data.filter(
        (t) => !filter || t.name.toLowerCase().includes(filter.toLowerCase())
      )
    : undefined;

  return (
    <div className="flex flex-col grow overflow-hidden">
      <SearchInput onSearch={setFilter} />
      <div className="shrink overflow-y-auto">
        <ul className="menu w-72 rounded-box">
          {filteredDocuments?.length ? (
            filteredDocuments.map((info) => {
              const href = `/editor/${encodeURIComponent(info.name)}`;
              return (
                <li key={info.id}>
                  <Link
                    href={href}
                    className={clsx({ active: href === pathname })}
                  >
                    {info.name}
                  </Link>
                </li>
              );
            })
          ) : filteredDocuments ? (
            <li className="disabled">No documents</li>
          ) : (
            <LoadingSkeleton />
          )}
        </ul>
      </div>
      <ul className="menu">
        <li className="pt-1">
          <a
            className="btn btn-sm btn-outline"
            href="#"
            onClick={() => {
              router.push(`/editor/${encodeURIComponent(randomDocumentId())}`);
            }}
          >
            <PlusCircle />
            New
          </a>
        </li>
      </ul>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="skeleton h-6"></div>
      <div className="skeleton h-6"></div>
      <div className="skeleton h-6"></div>
    </div>
  );
}
