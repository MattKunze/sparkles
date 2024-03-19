"use client";
import { ElementRef, useEffect, useRef, useState } from "react";

export type ModalPromptProps = {
  open: boolean;
  title: string;
  type?: "text" | "password";
  onCancel: () => void;
  onClose: (value: string) => void;
};
export function ModalPrompt({
  open,
  title,
  type,
  onCancel,
  onClose,
}: ModalPromptProps) {
  const inputRef = useRef<ElementRef<"input">>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }

    return () => {
      setValue("");
    };
  }, [open, inputRef]);

  return (
    <dialog
      className="modal"
      open={open}
      onKeyUp={(ev) => {
        if (ev.key === "Escape") {
          onCancel();
        }
        if (ev.key === "Enter" && value) {
          onClose(value);
        }
      }}
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <input
          ref={inputRef}
          type={type || "text"}
          className="input input-bordered w-full mt-2"
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
        />
        <div className="modal-action">
          <button
            className="btn"
            disabled={!value}
            onClick={() => onClose(value)}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
