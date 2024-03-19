import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { capitalize } from "lodash";

import { useModalPrompt } from "@/components/hooks/useModalPrompt";
import { trpc } from "@/utils/trpcClient";
import { GrantTypes, OauthEnvironment } from "@/types";

import { OauthState } from "./OAuthState";

type Props = {
  env: OauthEnvironment;
  onChange: (updated: OauthEnvironment) => void;
};
export function OauthForm({ env, onChange }: Props) {
  const context = trpc.useContext();
  const [config, setConfig] = useState(env.config);
  const debouncedContent = useDebounce(config, 500);
  const showPrompt = useModalPrompt();

  const updateCache = (env: OauthEnvironment) => {
    const environments = [...(context.environment.list.getData() ?? [])];
    environments[environments.findIndex((env) => env.id === env.id)] = env;
    context.environment.list.setData(undefined, environments);
  };

  const authorize = trpc.environment.authorize.useMutation({
    onMutate: async (args) => {
      if (env.config.grantType === "password_realm") {
        args.password = await showPrompt({
          title: "Enter password",
          type: "password",
        });
      }
    },
    onSuccess: (data) => {
      if ("authorizeUrl" in data) {
        window.open(data.authorizeUrl, "_blank");
      } else {
        updateCache(data);
      }
    },
  });
  const clearAuthState = trpc.environment.clearAuthState.useMutation({
    onSuccess: updateCache,
  });
  const refreshAccessToken = trpc.environment.refreshAccessToken.useMutation({
    onSuccess: updateCache,
  });

  useEffect(() => {
    if (debouncedContent !== env.config) {
      onChange({
        ...env,
        config: debouncedContent,
      });
    }
  }, [debouncedContent, env, onChange]);

  const update = (key: keyof OauthEnvironment["config"], value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="flex flex-col gap-2 pl-16">
      <div className="join join-horizontal self-center">
        {GrantTypes.map((key) => (
          <button
            key={key}
            className={clsx("btn join-item", {
              "btn-active": env.config.grantType === key,
            })}
            onClick={() => update("grantType", key)}
          >
            {key.split("_").map(capitalize).join(" ")}
          </button>
        ))}
      </div>
      <label className="input input-bordered flex items-center gap-2 ">
        <span className="w-32">Authorize URL</span>
        <input
          type="text"
          className="grow"
          placeholder="https://"
          value={config.authorizeUrl}
          onChange={(e) => update("authorizeUrl", e.target.value)}
        />
      </label>
      <label className="input input-bordered flex items-center gap-2">
        <span className="w-32">Token URL</span>
        <input
          type="text"
          className="grow"
          placeholder="https://"
          value={config.tokenUrl}
          onChange={(e) => update("tokenUrl", e.target.value)}
        />
      </label>
      <label className="input input-bordered flex items-center gap-2">
        <span className="w-32">Client ID</span>
        <input
          type="text"
          className="grow"
          placeholder="..."
          value={config.clientId}
          onChange={(e) => update("clientId", e.target.value)}
        />
      </label>
      <label className="input input-bordered flex items-center gap-2">
        <span className="w-32">Client Secret</span>
        <input
          type="password"
          className="grow"
          placeholder="..."
          value={config.clientSecret}
          onChange={(e) => update("clientSecret", e.target.value)}
        />
      </label>
      <label className="input input-bordered flex items-center gap-2">
        <span className="w-32">Scope</span>
        <input
          type="text"
          className="grow"
          placeholder="..."
          value={config.scope ?? ""}
          onChange={(e) => update("scope", e.target.value)}
        />
      </label>
      <label className="input input-bordered flex items-center gap-2">
        <span className="w-32">Audience</span>
        <input
          type="text"
          className="grow"
          placeholder="..."
          value={config.audience ?? ""}
          onChange={(e) => update("audience", e.target.value)}
        />
      </label>
      <OauthState
        state={env.state}
        onAuthorize={() => authorize.mutate({ id: env.id })}
        onClear={() => clearAuthState.mutate({ id: env.id })}
        onRefresh={() => refreshAccessToken.mutate({ id: env.id })}
      />
    </div>
  );
}
