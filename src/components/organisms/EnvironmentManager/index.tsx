import { useState } from "react";

import { PlusCircle } from "@/components/icons/PlusCircle";
import { trpc } from "@/utils/trpcClient";

import { EnvironmentVariables } from "./EnvironmentVariables";

export function EnvironmentManager() {
  const [newEnvironmentName, setNewEnvironmentName] = useState("");

  const context = trpc.useContext();
  const environments = trpc.environment.list.useQuery();
  const createEnv = trpc.environment.create.useMutation({
    onSuccess: (data) => {
      console.info({ data });
      setNewEnvironmentName("");
      context.environment.list.setData(undefined, data);
    },
  });
  const updateEnv = trpc.environment.update.useMutation({
    onSuccess: (data) => {
      // merge update into cached list
      const environments = [...(context.environment.list.getData() ?? [])];
      environments[environments.findIndex((env) => env.id === data.id)] = data;
      context.environment.list.setData(undefined, environments);
    },
  });
  const deleteEnv = trpc.environment.delete.useMutation({
    onSuccess: (data) => {
      const environments = [...(context.environment.list.getData() ?? [])];
      const pos = environments.findIndex((env) => env.id === data);
      environments.splice(pos, 1);
      context.environment.list.setData(undefined, environments);
    },
  });

  return (
    <>
      <div className="flex flex-row justify-between items-center">
        <article className="prose">
          <h2>Environments</h2>
        </article>
        <div className="join">
          <input
            className="input input-bordered input-sm join-item"
            placeholder="Create..."
            value={newEnvironmentName}
            onChange={(e) => setNewEnvironmentName(e.target.value)}
          />
          <button
            className="btn btn-sm join-item"
            disabled={!newEnvironmentName}
            onClick={() => createEnv.mutate({ name: newEnvironmentName })}
          >
            <PlusCircle />
          </button>
        </div>
      </div>
      <div className="join join-vertical w-full">
        {environments.data?.map((env) => (
          <div
            key={env.id}
            className="collapse collapse-arrow join-item border border-base-300"
            // not very disoverable
            onDoubleClick={(e) => {
              if (
                e.target instanceof HTMLInputElement &&
                e.target.type === "radio"
              ) {
                deleteEnv.mutate(env);
              }
            }}
          >
            <input type="radio" name="environments" />
            <div className="collapse-title text-lg font-medium">{env.name}</div>
            <div className="collapse-content">
              <EnvironmentVariables env={env} onChange={updateEnv.mutate} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
