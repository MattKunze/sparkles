"use client";

import { NotebookEditor } from "@/components/organisms/NotebookEditor";
import { trpc } from "@/utils/trpcClient";

export default function Page({ params }: { params: { slug: string } }) {
  const document = trpc.notebook.get.useQuery({
    id: decodeURIComponent(params.slug),
  });
  return (
    <div className="container mx-auto">
      {document.data ? (
        <NotebookEditor document={document.data} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
