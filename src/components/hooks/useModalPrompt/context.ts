import { createContext, MutableRefObject, useContext } from "react";
import { ModalPromptProps } from "@/components/molecules/ModalPrompt";

export type ShowPromptProps = Omit<
  ModalPromptProps,
  "open" | "onCancel" | "onClose"
>;
export type CancelPrompt = () => void;
export type AcceptPrompt = (value: string) => void;

type ModalPromptContextInterface = {
  showPrompt: (props: ShowPromptProps) => void;
  onCancel: MutableRefObject<CancelPrompt | null>;
  onClose: MutableRefObject<AcceptPrompt | null>;
};
export const ModalPromptContext = createContext<ModalPromptContextInterface>(
  {} as ModalPromptContextInterface
);

export function useModalPromptContext() {
  return useContext(ModalPromptContext);
}
