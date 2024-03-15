import { useState } from "react";

import { ShieldCheck } from "@/components/icons/ShieldCheck";
import { TableCells } from "@/components/icons/TableCells";
import { Trash } from "@/components/icons/Trash";
import { EnvironmentType } from "@/types";
import { trpc } from "@/utils/trpcClient";

import { EnvironmentVariables } from "./EnvironmentVariables";
import { NewEnvironmentInput } from "./NewEnvironmentInput";
import { OauthForm } from "./OauthForm";

const TypeIcons: Record<EnvironmentType, JSX.Element> = {
  kvp: <TableCells />,
  oauth: <ShieldCheck />,
};

export function EnvironmentManager() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(
    null
  );

  const context = trpc.useContext();
  const environments = trpc.environment.list.useQuery();
  const createEnv = trpc.environment.create.useMutation({
    onSuccess: (data, { name }) => {
      const pos = data.findIndex((env) => env.name === name);
      setSelectedEnvironment(data[pos].id);
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
        <NewEnvironmentInput createEnv={createEnv.mutate} />
      </div>
      <div className="join join-vertical w-full">
        {environments.data?.map((env) => (
          <div
            key={env.id}
            className="collapse collapse-arrow join-item border border-base-300 group"
          >
            <input
              type="radio"
              name="environments"
              className="ml-10"
              checked={selectedEnvironment === env.id}
              onChange={(ev) => {
                if (ev.target.checked) {
                  setSelectedEnvironment(env.id);
                }
              }}
            />
            <div className="absolute top-3 left-2 pt-px z-10 flex gap-2">
              <button
                className="btn btn-sm btn-ghost px-px text-gray-500 opacity-0 group-hover:opacity-100"
                onClick={() => deleteEnv.mutate(env)}
              >
                <Trash />
              </button>
              <button className="btn btn-sm btn-ghost px-px text-gray-500">
                {TypeIcons[env.type]}
              </button>
            </div>
            <div className="collapse-title text-lg font-medium pl-20">
              {env.name}
            </div>
            <div className="collapse-content">
              {env.type === "kvp" && (
                <EnvironmentVariables env={env} onChange={updateEnv.mutate} />
              )}
              {env.type === "oauth" && (
                <OauthForm env={env} onChange={updateEnv.mutate} />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
