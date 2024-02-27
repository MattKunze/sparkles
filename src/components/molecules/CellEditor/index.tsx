"use client";
import { useDebounce } from "@uidotdev/usehooks";
import Editor, { Monaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

import { Play } from "@/components/icons/Play";
import { NotebookCell } from "@/types";

import { LanguageDropdown } from "./LanguageDropdown";

const DefaultEditorOptions = {
  lineNumbers: "off",
  minimap: { enabled: false },
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  scrollbar: {
    vertical: "hidden",
    handleMouseWheel: false,
  },
};

const EditorLanguages: Record<NotebookCell["language"], string> = {
  chat: "text",
  markdown: "markdown",
  typescript: "typescript",
};

type Props = {
  cell: NotebookCell;
  onEvaluate: () => void;
  onUpdate: (content: string, language?: NotebookCell["language"]) => void;
};
export function CellEditor(props: Props) {
  const { cell } = props;
  const editorRef = useRef<Monaco>(null);
  const disposeRefs = useRef<Array<{ dispose: () => void }>>([]);
  const [lineCount, setLineCount] = useState<number>(0);
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

  useEffect(() => {
    const refs = disposeRefs.current;
    return () => {
      refs.forEach((d) => d.dispose());
    };
  }, []);

  function updateLineCount() {
    // todo - need to find a public/documented API for this
    setLineCount(editorRef.current._getViewModel().getLineCount());
  }

  return (
    <div className="flex flex-row group">
      <div className="flex flex-col mr-1">
        <LanguageDropdown
          language={cell.language}
          onChange={(language) => {
            onUpdate("", language);
            setContent("");
          }}
        />
        <button
          className="btn btn-sm btn-ghost mt-2 px-1"
          disabled={cell.language === "markdown"}
          onClick={props.onEvaluate}
        >
          <Play />
        </button>
      </div>
      <div className="flex-grow border rounded pt-4 pr-2 bg-white">
        <Editor
          path={props.cell.id}
          height={`${(lineCount + 1) * 18}px`}
          language={EditorLanguages[props.cell.language]}
          value={content}
          options={DefaultEditorOptions}
          onChange={(text) => {
            setContent(text);
            updateLineCount();
            editorRef.current.revealLine(0);
          }}
          onMount={(editor) => {
            editorRef.current = editor;
            updateLineCount();

            // listen for fold change events
            disposeRefs.current.push(
              editorRef.current.onDidChangeHiddenAreas(updateLineCount)
            );
          }}
        />
      </div>
    </div>
  );
}
