export type ExecutionResultBase = {
  executionId: string;
  cellId: string;
  timestamp: Date;
};

export type ExecutionResultSuccess = ExecutionResultBase & {
  duration: number;
  data: unknown;
};

export type ExecutionResultError = ExecutionResultBase & {
  duration: number;
  error: Error;
};

export type ExecutionResult =
  | ExecutionResultBase
  | ExecutionResultSuccess
  | ExecutionResultError;
