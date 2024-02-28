import { Document } from "@/components/icons/Document";
import { DocumentChartBar } from "@/components/icons/DocumentChartBar";
import { DocumentText } from "@/components/icons/DocumentText";

export type MarkdownPreviewType = "none" | "default" | "mermaid";

const Icons: Record<MarkdownPreviewType, JSX.Element> = {
  none: <Document />,
  default: <DocumentText />,
  mermaid: <DocumentChartBar />,
};

type Props = {
  preview: MarkdownPreviewType;
  onChange: (preview: MarkdownPreviewType) => void;
};
export function PreviewDropdown(props: Props) {
  const onChange = (preview: MarkdownPreviewType) => {
    props.onChange(preview);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="dropdown">
      <button tabIndex={0} className="btn btn-sm btn-ghost mt-2 px-1">
        {Icons[props.preview]}
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <a onClick={() => onChange("none")}>
            {Icons.none}
            None
          </a>
        </li>
        <li>
          <a onClick={() => onChange("default")}>
            {Icons.default}
            Preview
          </a>
        </li>
        <li>
          <a onClick={() => onChange("mermaid")}>
            {Icons.mermaid}
            Mermaid
          </a>
        </li>
      </ul>
    </div>
  );
}
