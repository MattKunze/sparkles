"use client";

import { NotebookEditor } from "@/components/organisms/NotebookEditor";
import { trpc } from "@/utils/trpc";

export default function Page({ params }: { params: { slug: string } }) {
  const document = trpc.notebook.get.useQuery({ id: params.slug });
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
