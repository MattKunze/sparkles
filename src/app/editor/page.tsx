"use client";
import Editor, { useMonaco } from "@monaco-editor/react";
import { produce } from "immer";
import { useState } from "react";

import {
  createEmptyCell,
  createEmptyDocument,
  NotebookDocument,
} from "@/types";

const DefaultEditorOptions = {
  minimap: { enabled: false },
};

export default function EditorPage() {
  const monaco = useMonaco();
  console.info(monaco);
  const [notebook, setNotebook] = useState<NotebookDocument>(
    createEmptyDocument()
  );

  return (
    <div className="container mx-auto">
      {notebook.cells.map((cell) => (
        <div key={cell.id} className="my-5">
          <span className="badge badge-primary">{cell.language}</span>
          <span className="badge badge-ghost">{cell.id.slice(-6)}</span>
          <Editor
            path={cell.id}
            height="100px"
            language={cell.language}
            value={cell.content}
            options={DefaultEditorOptions}
            onChange={(...args) => {
              console.info("onChange", args);
            }}
            onValidate={(...args) => {
              console.info("onValidate", args);
            }}
          />
        </div>
      ))}
      <button
        className="btn btn-primary"
        onClick={() => {
          setNotebook(
            produce(notebook, (draft) => {
              draft.cells.push(
                createEmptyCell({
                  language: "typescript",
                })
              );
            })
          );
        }}
      >
        +
      </button>
    </div>
  );
}
