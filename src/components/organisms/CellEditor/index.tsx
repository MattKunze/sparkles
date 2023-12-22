"use client";
import { useDebounce } from "@uidotdev/usehooks";
import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

import { Play } from "@/components/icons/Play";
import { XMark } from "@/components/icons/XMark";
import { NotebookCell } from "@/types";

const DefaultEditorOptions = {
  lineNumbers: "off",
  minimap: { enabled: false },
};

const LanguageExtensions: Record<NotebookCell["language"], string> = {
  markdown: ".md",
  typescript: ".ts",
};

type Props = {
  cell: NotebookCell;
  onDelete: () => void;
  onEvaluate: () => void;
  onUpdate: (content: string) => void;
};
export function CellEditor(props: Props) {
  const { cell } = props;
  const [content, setContent] = useState<string | undefined>(cell.content);
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
    <div className="flex flex-row group">
      <div className="flex flex-col mr-1">
        <span className="badge badge-accent px-0 w-full">
          {LanguageExtensions[cell.language]}
        </span>
        <button
          className="btn btn-sm btn-accent btn-ghost mt-2 px-1"
          disabled={cell.language === "markdown"}
          onClick={props.onEvaluate}
        >
          <Play />
        </button>
      </div>
      <div className="flex-grow border pt-5 bg-white relative">
        <div className="absolute -top-3 -right-3">
          <button
            className="btn btn-xs btn-secondary px-0 opacity-0 group-focus-within:opacity-100 transition-opacity"
            onClick={props.onDelete}
          >
            <XMark />
          </button>
        </div>
        <Editor
          path={props.cell.id}
          height="100px"
          language={props.cell.language}
          value={props.cell.content}
          options={DefaultEditorOptions}
          onChange={setContent}
        />
      </div>
    </div>
  );
}
