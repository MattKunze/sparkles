type Props = {
  error: Error;
  stack?: string;
};
export function ErrorDetails({ error, stack }: Props) {
  return (
    <table className="table table-sm w-full">
      <tbody>
        <tr>
          <th className="font-mono">{error.name}</th>
          <td className="w-full">{error.message}</td>
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
