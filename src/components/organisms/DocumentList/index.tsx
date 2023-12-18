"use client";
import { useRouter } from "next/navigation";

import { PlusCircle } from "@/components/icons/PlusCircle";
import { randomDocumentId } from "@/types";
import { trpc } from "@/utils/trpcClient";

export default function DocumentList() {
  const router = useRouter();
  const documents = trpc.notebook.list.useQuery();
  return (
    <ul className="menu w-72 rounded-box">
      {documents.data ? (
        documents.data.map((id) => (
          <li key={id}>
            <a href={`/editor/${encodeURIComponent(id)}`}>{id}</a>
          </li>
        ))
      ) : (
        <LoadingSkeleton />
      )}
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
