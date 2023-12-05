import { ExecutionResult } from "@/types";

type Props = {
  result: ExecutionResult;
};
export function CellResult(props: Props) {
  return <pre>{JSON.stringify(props.result, null, 2)}</pre>;
}
