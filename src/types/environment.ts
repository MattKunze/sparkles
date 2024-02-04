export type Environment = {
  id: string;
  name: string;
  owner: string;
  variables: Record<string, { type: "plain" | "secret"; value: string }>;
};
