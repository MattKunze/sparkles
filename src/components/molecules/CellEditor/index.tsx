"use client";
import { useDebounce } from "@uidotdev/usehooks";
import Editor, { Monaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { DocumentText } from "@/components/icons/DocumentText";
import { Play } from "@/components/icons/Play";
import { NotebookCell } from "@/types";

import { LanguageDropdown } from "./LanguageDropdown";
import { MarkdownPreview } from "./MarkdownPreview";

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
  const [content, setContent] = useState<string>(cell.content);
  const debouncedContent = useDebounce(content, 500);
  const [markdownPreview, setMarkdownPreview] = useState(false);

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
        {cell.language === "markdown" ? (
          <button
            className={clsx("btn btn-sm btn-ghost mt-2 px-1", {
              "btn-active": markdownPreview,
            })}
            onClick={() => setMarkdownPreview(!markdownPreview)}
          >
            <DocumentText />
          </button>
        ) : (
          <button
            className="btn btn-sm btn-ghost mt-2 px-1"
            onClick={props.onEvaluate}
          >
            <Play />
          </button>
        )}
      </div>
      <div
        className={clsx("flex-grow border rounded pr-2 bg-white", {
          "grid grid-cols-2 gap-2": markdownPreview,
        })}
      >
        <Editor
          className="mt-4"
          path={props.cell.id}
          height={`${(lineCount + 1) * 18}px`}
          language={EditorLanguages[props.cell.language]}
          value={content}
          options={DefaultEditorOptions}
          onChange={(text) => {
            setContent(text ?? "");
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
        {markdownPreview && (
          <MarkdownPreview className="ml-2 mt-2" content={content} />
        )}
      </div>
    </div>
  );
}
