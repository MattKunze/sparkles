import Chance from "chance";
import { ulid } from "ulid";
import { DeepReadonly } from "ts-essentials";

export type NotebookCell = DeepReadonly<{
  id: string;
  timestamp: Date;
  language: "markdown" | "typescript";
  content: string;
}>;

export type NotebookDocument = DeepReadonly<{
  id: string;
  owner: string;
  name: string;
  timestamp: Date;
  cells: NotebookCell[];
  environmentId?: string;
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
  owner,
  name,
  language,
}: {
  owner: string;
  name: string;
  language?: NotebookCell["language"];
}): NotebookDocument {
  return {
    id: ulid(),
    owner,
    name,
    timestamp: new Date(),
    cells: [createEmptyCell({ language })],
  };
}

// meh
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
