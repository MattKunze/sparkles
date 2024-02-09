"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { PlusCircle } from "@/components/icons/PlusCircle";
import SearchInput from "@/components/molecules/SearchInput";
import { randomDocumentId } from "@/types";
import { trpc } from "@/utils/trpcClient";

import { TagsPopup } from "./TagsPopup";

export default function DocumentList() {
  const pathname = usePathname();
  const router = useRouter();
  const documents = trpc.notebook.list.useQuery();
  const [filter, setFilter] = useState<string[]>([]);

  let filteredDocuments = documents.data
    ? documents.data.filter((doc) =>
        filter.every(
          (f) =>
            includesLowerCase(doc.name, f) ||
            doc.tags?.some((tag) => includesLowerCase(tag, f))
        )
      )
    : undefined;

  return (
    <div className="flex flex-col grow overflow-hidden">
      <SearchInput onSearch={setFilter} />
      <div className="shrink overflow-y-auto">
        <ul className="menu w-72 rounded-box">
          {filteredDocuments?.length ? (
            filteredDocuments.map((info) => (
              <li key={info.id}>
                <Link
                  href={`/editor/${encodeURIComponent(info.id)}`}
                  className={clsx("flex justify-between", {
                    active:
                      pathname &&
                      [
                        `/editor/${encodeURIComponent(info.id)}`,
                        `/editor/${encodeURIComponent(info.name)}`,
                      ].includes(pathname),
                  })}
                >
                  <span>{info.name}</span>
                  {info.tags?.length && <TagsPopup tags={info.tags} />}
                </Link>
              </li>
            ))
          ) : filteredDocuments ? (
            <li className="disabled">
              {documents.data?.length
                ? "No matching documents"
                : "No documents"}
            </li>
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

function includesLowerCase(str: string, search: string) {
  return str.toLowerCase().includes(search.toLowerCase());
}
