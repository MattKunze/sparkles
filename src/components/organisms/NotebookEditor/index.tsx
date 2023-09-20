"use client";
import Editor from "@monaco-editor/react";
import { produce } from "immer";
import { useState } from "react";

import { createEmptyCell, NotebookDocument } from "@/types";

const DefaultEditorOptions = {
  minimap: { enabled: false },
};

type Props = {
  document: NotebookDocument;
};
export function NotebookEditor(props: Props) {
  const [document, setDocument] = useState<NotebookDocument>(props.document);

  return (
    <>
      {document.cells.map((cell) => (
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
          setDocument(
            produce(document, (draft) => {
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
    </>
  );
}
