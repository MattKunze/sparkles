"use client";

import { trpc } from "@/utils/trpc";

export default function EditorPage() {
  const documents = trpc.notebook.list.useQuery();

  return (
    <div className="container mx-auto">
      {documents.data ? (
        <ul>
          {documents.data.map((id) => (
            <li key={id}>
              <a href={`./editor/${encodeURIComponent(id)}`}>{id}</a>
            </li>
          ))}
        </ul>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
