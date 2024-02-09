import { useMemo } from "react";

import { trpc } from "@/utils/trpcClient";

// todo - not sure we want these builtins or at a minimum should be configurable
const DefaultTags = ["public", "secret", "garbage"];

export function useAvailableTags(): readonly string[] {
  const utils = trpc.useContext();
  const documents = utils.notebook.list.getData();

  return useMemo(() => {
    const set = new Set<string>(DefaultTags);
    if (documents) {
      for (const doc of documents) {
        if (doc.tags) {
          for (const tag of doc.tags) {
            set.add(tag);
          }
        }
      }
    }

    return [...set].sort();
  }, [documents]);
}
