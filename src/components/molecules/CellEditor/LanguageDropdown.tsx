import { CellLanguages, NotebookCell } from "@/types";

const LanguageExtensions: Record<NotebookCell["language"], string> = {
  markdown: ".md",
  typescript: ".ts",
};

type Props = {
  language: NotebookCell["language"];
  onChange: (language: NotebookCell["language"]) => void;
};
export function LanguageDropdown(props: Props) {
  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="badge badge-accent">
        {LanguageExtensions[props.language]}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        {CellLanguages.map((language) => (
          <li key={language}>
            <a
              onClick={() => {
                if (language !== props.language) {
                  props.onChange(language);
                }
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
            >
              {language}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
