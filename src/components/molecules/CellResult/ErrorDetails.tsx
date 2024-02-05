type Props = {
  error: Error | string;
  stack?: string;
};
export function ErrorDetails({ error, stack }: Props) {
  return (
    <table className="table table-sm w-full">
      <tbody>
        <tr>
          <th className="font-mono whitespace-nowrap">
            {error instanceof Error ? error.name : "Fail ;("}
          </th>
          <td className="w-full">
            {error instanceof Error ? error.message : error}
          </td>
        </tr>
        {stack && (
          <tr>
            <td colSpan={2}>
              <pre>{stack}</pre>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
