"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { PlusCircle } from "@/components/icons/PlusCircle";
import { randomDocumentId } from "@/types";
import { trpc } from "@/utils/trpcClient";

export default function DocumentList() {
  const pathname = usePathname();
  const router = useRouter();
  const documents = trpc.notebook.list.useQuery();
  return (
    <div className="flex flex-col grow overflow-hidden">
      <div className="shrink overflow-y-auto">
        <ul className="menu w-72 rounded-box">
          {documents.data?.length ? (
            documents.data.map((info) => {
              const href = `/editor/${encodeURIComponent(info.id)}`;
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
          ) : documents.data ? (
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
