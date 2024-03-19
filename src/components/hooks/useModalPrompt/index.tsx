import { useCallback } from "react";

import { ShowPromptProps, useModalPromptContext } from "./context";
export { ModalPromptProvider } from "./provider";

type PromptFunction = (props: ShowPromptProps) => Promise<string>;
export function useModalPrompt() {
  const promptContext = useModalPromptContext();

  const showPrompt: PromptFunction = useCallback(
    (props) =>
      new Promise((resolve, reject) => {
        promptContext.onClose.current = resolve;
        promptContext.onCancel.current = reject;
        promptContext.showPrompt(props);
      }),
    [promptContext]
  );

  return showPrompt;
}
