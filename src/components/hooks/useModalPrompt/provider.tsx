import { useCallback, useMemo, useRef, useState } from "react";

import { ModalPrompt } from "@/components/molecules/ModalPrompt";

import {
  AcceptPrompt,
  CancelPrompt,
  ModalPromptContext,
  ShowPromptProps,
} from "./context";

export const ModalPromptProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [promptState, setPromptState] = useState<
    { open: boolean } & ShowPromptProps
  >({
    open: false,
    title: "",
  });
  const onCancel = useRef<CancelPrompt | null>(null);
  const onClose = useRef<AcceptPrompt | null>(null);
  const context = useMemo(
    () => ({
      showPrompt: (props: ShowPromptProps) => {
        setPromptState({ open: true, ...props });
      },
      onCancel,
      onClose,
    }),
    []
  );
  const cancelPrompt = useCallback(() => {
    setPromptState({ open: false, title: "" });
    onCancel.current?.();
    onCancel.current = null;
    onClose.current = null;
  }, []);
  const closePrompt = useCallback((value: string) => {
    setPromptState({ open: false, title: "" });
    onClose.current?.(value);
    onCancel.current = null;
    onClose.current = null;
  }, []);
  return (
    <ModalPromptContext.Provider value={context}>
      {children}
      <ModalPrompt
        {...promptState}
        onCancel={cancelPrompt}
        onClose={closePrompt}
      />
    </ModalPromptContext.Provider>
  );
};
