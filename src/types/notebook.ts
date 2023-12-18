import Chance from "chance";
import { ulid } from "ulid";
import { DeepReadonly } from "ts-essentials";

export type NotebookCell = DeepReadonly<{
  id: string;
  timestamp: Date;
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
  timestamp: Date;
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
    timestamp: new Date(),
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
    timestamp: new Date(),
    executionContext,
    cells: [createEmptyCell({ language })],
  };
}

const chance = new Chance();

export function randomDocumentId() {
  const key = chance.pickone([
    "animal",
    "company",
    "name",
    "profession",
  ] as const);
  return chance[key]();
}
