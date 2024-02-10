"use client";
import { useDebounce } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Trash } from "@/components/icons/Trash";
import { EnvironmentDropdown } from "@/components/molecules/EnvironmentDropdown";
import { TagsEditor } from "@/components/molecules/TagsEditor";
import { useToastContext } from "@/components/organisms/ToastContext";
import { NotebookDocument } from "@/types";
import { trpc } from "@/utils/trpcClient";

import { useAvailableTags } from "./useAvailableTags";

type Props = {
  document: NotebookDocument;
  onDocumentUpdate: (document: NotebookDocument) => void;
};
export function DocumentHeader(props: Props) {
  const { document } = props;
  const utils = trpc.useContext();
  const router = useRouter();
  const [name, setName] = useState(document.name);
  const debouncedName = useDebounce(name, 500);

  const { showToast } = useToastContext();
  const environments = trpc.environment.list.useQuery();
  const availableTags = useAvailableTags();

  const setTags = trpc.notebook.setTags.useMutation({
    onSuccess: (data) => {
      utils.notebook.get.setData({ nameOrId: data.name }, data);

      // seems out of place here, but necessary so useAvailableTags will update
      const list = utils.notebook.list.getData();
      if (list) {
        const pos = list.findIndex((t) => t.id === data.id) ?? -1;
        if (pos >= 0) {
          const update = [...list];
          update[pos] = data;
          utils.notebook.list.setData(undefined, update);
        }
      }

      props.onDocumentUpdate(data);
    },
  });
  const selectEnvironment = trpc.notebook.selectEnvironment.useMutation({
    onSuccess: (data) => {
      utils.notebook.get.setData({ nameOrId: data.name }, data);
      props.onDocumentUpdate(data);
    },
  });
  const renameDocument = trpc.notebook.rename.useMutation({
    onSuccess: (data) => {
      // rename the document in the cache and the current route
      const newName = data.name;
      utils.notebook.get.setData({ nameOrId: newName }, data);
      router.replace(`/editor/${encodeURIComponent(newName)}`);
      // also update the list of available documents
      utils.notebook.list.invalidate();
      props.onDocumentUpdate(data);
    },
  });
  const deleteDocument = trpc.notebook.delete.useMutation({
    onMutate: () => {
      router.push("/");
    },
    onSuccess: () => {
      utils.notebook.list.invalidate();
      showToast({
        message: "Document deleted",
        type: "error",
        icon: true,
        delay: 2000,
      });
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
    <div className="flex items-center justify-between my-1">
      <input
        className="text-2xl font-bold grow bg-transparent"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex items-center ml-2 gap-2">
        <TagsEditor
          availableTags={availableTags}
          tags={document.tags ?? []}
          setTags={(tags) => {
            setTags.mutate({
              documentId: document.id,
              documentTimestamp: document.timestamp,
              tags,
            });
          }}
        />
        <EnvironmentDropdown
          environments={environments.data ?? []}
          selectedEnvironment={environments.data?.find(
            (t) => t.id === document.environmentId
          )}
          setSelectedEnvironment={(id) => {
            selectEnvironment.mutate({
              documentId: document.id,
              documentTimestamp: document.timestamp,
              environmentId: id,
            });
          }}
        />
        <button
          className="btn btn-sm btn-accent btn-outline"
          onClick={() => deleteDocument.mutate(document)}
        >
          <Trash />
        </button>
      </div>
    </div>
  );
}
