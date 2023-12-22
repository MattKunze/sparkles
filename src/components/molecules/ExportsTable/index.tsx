import { isEmpty } from "lodash";

type Props = {
  data: Record<string, unknown>;
};
export function ExportsTable({ data }: Props) {
  if (isEmpty(data)) {
    return (
      <div className="alert">
        <span className="font-mono">Empty results</span>
      </div>
    );
  }
  return (
    <table className="table table-sm w-full">
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr key={key}>
            <th className="font-mono">{key}</th>
            <td className="font-mono w-full">{JSON.stringify(value)}</td>
            <td>{typeof value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
