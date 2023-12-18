"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Trash } from "@/components/icons/Trash";
import { NotebookDocument } from "@/types";
import { trpc } from "@/utils/trpcClient";

type Props = {
  document: NotebookDocument;
};
export function DocumentHeader(props: Props) {
  const { document } = props;
  const utils = trpc.useContext();
  const router = useRouter();
  const [title, setTitle] = useState(document.id);
  const deleteDocument = trpc.notebook.delete.useMutation({
    onSuccess: () => {
      utils.notebook.list.invalidate();
      router.push("/");
    },
  });

  return (
    <div className="flex items-center justify-between my-1 mr-2">
      <input
        className="text-2xl font-bold grow bg-transparent"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex items-center">
        <button
          className="btn btn-sm btn-accent btn-outline ml-2"
          onClick={() => deleteDocument.mutate(document)}
        >
          <Trash />
        </button>
      </div>
    </div>
  );
}
