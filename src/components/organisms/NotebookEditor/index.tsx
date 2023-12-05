"use client";
import { useDebounce } from "@uidotdev/usehooks";
import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

import { NotebookCell, NotebookDocument } from "@/types";
import { trpc } from "@/utils/trpcClient";

const DefaultEditorOptions = {
  minimap: { enabled: false },
};

type Props = {
  document: NotebookDocument;
};
export function NotebookEditor(props: Props) {
  const [document, setDocument] = useState<NotebookDocument>(props.document);

  const addCell = trpc.notebook.addCell.useMutation({
    onSuccess: setDocument,
  });
  const deleteCell = trpc.notebook.deleteCell.useMutation({
    onSuccess: setDocument,
  });
  const updateCell = trpc.notebook.updateCell.useMutation({
    onSuccess: setDocument,
  });

  return (
    <>
      {document.cells.map((cell) => (
        <div key={cell.id} className="my-5">
          <span className="badge badge-primary">{cell.language}</span>
          <span
            className="badge badge-ghost"
            onClick={() =>
              deleteCell.mutate({
                documentId: document.id,
                documentTimestamp: document.timestamp,
                cellId: cell.id,
              })
            }
          >
            {cell.id.slice(-6)}
          </span>
          <CellEditor
            cell={cell}
            onUpdate={(content) =>
              updateCell.mutate({
                documentId: document.id,
                documentTimestamp: document.timestamp,
                cellId: cell.id,
                content,
              })
            }
          />
        </div>
      ))}
      <button
        className="btn btn-primary"
        onClick={() =>
          addCell.mutate({
            documentId: document.id,
            documentTimestamp: document.timestamp,
          })
        }
      >
        +
      </button>
    </>
  );
}

function CellEditor(props: {
  cell: NotebookCell;
  onUpdate: (content: string) => void;
}) {
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
      onValidate={(...args) => {
        console.info("onValidate", args);
      }}
    />
  );
}
