"use client";
import { useDebounce } from "@uidotdev/usehooks";
import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

import { NotebookCell } from "@/types";

const DefaultEditorOptions = {
  minimap: { enabled: false },
};

type Props = {
  cell: NotebookCell;
  onUpdate: (content: string) => void;
};
export function CellEditor(props: Props) {
  const [content, setContent] = useState<string | undefined>(
    props.cell.content
  );
  const debouncedContent = useDebounce(content, 500);

  const { onUpdate } = props;
  useEffect(
    () => {
      if (debouncedContent && debouncedContent !== props.cell.content) {
        onUpdate(debouncedContent);
      }
    },
    // womp womp
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedContent]
  );

  return (
    <Editor
      path={props.cell.id}
      height="100px"
      language={props.cell.language}
      value={props.cell.content}
      options={DefaultEditorOptions}
      onChange={setContent}
    />
  );
}
