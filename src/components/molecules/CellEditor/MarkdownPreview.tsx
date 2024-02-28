import { ElementRef, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import clsx from "clsx";
import mermaid from "mermaid";

type Props = {
  className?: string;
  content: string;
  mermaid?: boolean;
};
export function MarkdownPreview(props: Props) {
  return (
    <article className={clsx("prose", props.className)}>
      {props.mermaid ? (
        <Mermaid>{props.content}</Mermaid>
      ) : (
        <Markdown>{props.content}</Markdown>
      )}
    </article>
  );
}

function Mermaid({ children }: { children: string }) {
  useEffect(() => {
    mermaid.contentLoaded();
  }, [children]);

  // easiest way I've figured out to force mermaid to re-render is to
  // mount/unmount when the contents change
  return (
    <div key={children} className="mermaid mb-2 flex justify-center">
      {children}
    </div>
  );
}
