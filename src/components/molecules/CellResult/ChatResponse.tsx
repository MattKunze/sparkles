import Markdown from "react-markdown";

import { ExecutionChatResult } from "@/types";

type Props = {
  result: ExecutionChatResult["chat"];
};
export function ChatResponse({ result }: Props) {
  return (
    <div className="p-2 pl-4">
      <article className="prose">
        <Markdown>
          {"response" in result
            ? result.response.choices[0].message.content
            : result.stream.join("")}
        </Markdown>
      </article>
    </div>
  );
}
