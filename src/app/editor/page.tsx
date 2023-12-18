"use client";
import Link from "next/link";

import { trpc } from "@/utils/trpcClient";

export default function EditorPage() {
  const documents = trpc.notebook.list.useQuery();

  return (
    <div className="container mx-auto">
      {documents.data ? (
        <ul>
          {documents.data.map((id) => (
            <li key={id}>
              <Link href={`./editor/${encodeURIComponent(id)}`}>{id}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
