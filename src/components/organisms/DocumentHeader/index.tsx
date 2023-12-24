"use client";
import { useDebounce } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [name, setName] = useState(document.name);
  const debouncedName = useDebounce(name, 500);

  const renameDocument = trpc.notebook.rename.useMutation({
    onSuccess: (data) => {
      // rename the document in the cache and the current route
      const newName = data.name;
      utils.notebook.get.setData({ nameOrId: newName }, data);
      router.replace(`/editor/${encodeURIComponent(newName)}`);
      // also update the list of available documents
      utils.notebook.list.invalidate();
    },
  });
  const deleteDocument = trpc.notebook.delete.useMutation({
    onMutate: () => {
      router.push("/");
    },
    onSuccess: () => {
      utils.notebook.list.invalidate();
    },
  });

  useEffect(
    () => {
      if (debouncedName && debouncedName !== document.name) {
        renameDocument.mutate({
          documentId: document.id,
          documentTimestamp: document.timestamp,
          name: debouncedName,
        });
      }
    },
    // womp womp
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
    [debouncedName, document.name]
  );

  return (
    <div className="flex items-center justify-between my-1 mr-2">
      <input
        className="text-2xl font-bold grow bg-transparent"
        value={name}
        onChange={(e) => setName(e.target.value)}
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
