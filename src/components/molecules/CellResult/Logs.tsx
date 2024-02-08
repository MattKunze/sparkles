import clsx from "clsx";

import { ExecutionLogResult } from "@/types";

type Props = {
  executionStart: Date;
  logs: ExecutionLogResult["logs"];
};
export function Logs({ executionStart, logs }: Props) {
  return (
    <table className="table table-xs w-full">
      <tbody>
        {logs.map((log, index) => (
          <tr key={index}>
            <td>
              <span
                className={clsx("font-mono badge", {
                  "badge-outline": log.level === "DEBUG",
                  "badge-error": log.level === "ERROR",
                  "badge-info": log.level === "INFO",
                  "badge-warning": log.level === "WARN",
                })}
              >
                {log.level}
              </span>
            </td>
            <td className="font-mono w-full">{JSON.stringify(log.args)}</td>
            <td>{log.timestamp.getTime() - executionStart.getTime()}ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
