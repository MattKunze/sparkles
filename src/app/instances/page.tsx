"use client";
import { capitalize } from "lodash";

import { Trash } from "@/components/icons/Trash";
import { trpc } from "@/utils/trpcClient";

export default function InstancesPage() {
  const context = trpc.useContext();
  const instances = trpc.kernel.instances.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const deleteInstance = trpc.kernel.deleteInstance.useMutation({
    onSuccess: () => {
      context.kernel.instances.invalidate();
    },
  });

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Image</th>
          <th>Status</th>
          <th>Labels</th>
        </tr>
      </thead>
      <tbody>
        {instances.data?.map((instance) => (
          <tr key={instance.Id}>
            <td>{instance.Names[0].slice(1)}</td>
            <td>{instance.Image}</td>
            <td>
              {capitalize(instance.State)} - {instance.Status}
            </td>
            <td>
              {Object.entries(instance.Labels)
                .filter(([key]) => key.startsWith("sparkles."))
                .map(([key, value]) => (
                  <span key={key} className="badge badge-ghost">
                    {key.split(".")[1]}:{value}
                  </span>
                ))}
            </td>
            <td>
              <button
                className="btn btn-outline btn-error btn-sm"
                onClick={() => deleteInstance.mutate(instance.Id)}
              >
                <Trash />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
