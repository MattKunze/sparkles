import { useMemo } from "react";
import Markdown from "react-markdown";

import { parseInspectRepresentation, toJSON } from "@/utils/inspectParser";

type ChatResponse = {
  choices: Array<{
    message: { content: string; type: string };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type Props = {
  response: string;
};
export function ChatResponse(props: Props) {
  const json = useMemo(() => {
    const t = toJSON(
      parseInspectRepresentation(props.response)
    ) as ChatResponse;
    t.choices[0].message.content = t.choices[0].message.content.replace(
      /\\n/g,
      "\n"
    );
    return t;
  }, [props.response]);
  console.info(json);
  return (
    <div className="p-2 pl-4">
      <article className="prose">
        <Markdown>{json.choices[0].message.content}</Markdown>
      </article>
      <div className="flex justify-end">
        <div className="badge badge-ghost">
          {json.usage.total_tokens} tokens
        </div>
      </div>
    </div>
  );
}
