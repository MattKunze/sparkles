import { NotebookCell } from "./notebook";

export type ExecutionMetaInfo = {
  executionId: string;
  linkedExecutionIds?: string[];
  documentId: string;
  cellId: string;
  language: NotebookCell["language"];
  createTimestamp: Date;
  executeTimestamp?: Date;
  exportKeys?: string[];
};

export type ExecutionLogResult = {
  executionId: string;
  logs: Array<{ timestamp: Date; level: string; args: unknown[] }>;
};

export type ExecutionSuccessResult = {
  executionId: string;
  success: {
    duration: number;
    serializedExports: Record<string, string>;
  };
};

export type ExecutionErrorResult = {
  executionId: string;
  error: {
    duration: number;
    data: Error | string;
    stack?: string;
  };
};

export type ExecutionDeferredResult = {
  executionId: string;
  deferred: Record<
    string, // export key
    {
      result: "resolved" | "rejected";
      duration: number;
      serialized: string;
    }
  >;
};

export type ExecutionResult =
  | ExecutionSuccessResult
  | ExecutionErrorResult
  | ExecutionDeferredResult
  | ExecutionLogResult;
