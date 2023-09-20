import { ulid } from "ulid";
import { DeepReadonly } from "ts-essentials";

export type NotebookCell = DeepReadonly<{
  id: string;
  language: "markdown" | "typescript";
  content: string;
  results?: {
    status: "ok" | "error" | "running";
    content: string;
    timestamp: number;
  };
}>;

export type NotebookDocument = DeepReadonly<{
  id: string;
  executionContext?: {
    environmentVariables?: Record<string, string>;
  };
  cells: NotebookCell[];
}>;

const defaultContent = {
  markdown: "# Add some details",
  typescript: "// let's go",
} as const;

export function createEmptyCell({
  language = "markdown",
}: {
  language?: NotebookCell["language"];
} = {}): NotebookCell {
  return {
    id: ulid(),
    language,
    content: defaultContent[language],
  };
}

export function createEmptyDocument({
  id = ulid(),
  executionContext,
  language,
}: {
  id?: string;
  executionContext?: NotebookDocument["executionContext"];
  language?: NotebookCell["language"];
} = {}): NotebookDocument {
  return {
    id,
    executionContext,
    cells: [createEmptyCell({ language })],
  };
}
