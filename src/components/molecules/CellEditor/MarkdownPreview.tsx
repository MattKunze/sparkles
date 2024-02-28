import clsx from "clsx";
import Markdown from "react-markdown";

type Props = {
  content: string;
  className?: string;
};
export function MarkdownPreview(props: Props) {
  return (
    <article className={clsx("prose", props.className)}>
      <Markdown>{props.content}</Markdown>
    </article>
  );
}
