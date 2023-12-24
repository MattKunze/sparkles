"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { NotebookEditor } from "@/components/organisms/NotebookEditor";
import { trpc } from "@/utils/trpcClient";

export default function Page({ params }: { params: { slug: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const document = trpc.notebook.get.useQuery({
    nameOrId: decodeURIComponent(params.slug),
  });

  useEffect(() => {
    if (document.status === "success") {
      const href = `/editor/${encodeURIComponent(document.data.name)}`;
      if (href !== pathname) {
        router.replace(href);
      }
    }
  }, [document.status, document.data?.name, pathname, router]);

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
