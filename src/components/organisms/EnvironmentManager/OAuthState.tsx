import { useCopyToClipboard } from "@uidotdev/usehooks";
import clsx from "clsx";

import { ArrowPath } from "@/components/icons/ArrowPath";
import { CheckCircle } from "@/components/icons/CheckCircle";
import { ExclamationTriangle } from "@/components/icons/ExclamationTriangle";
import { QuestionMarkCircle } from "@/components/icons/QuestionMarkCircle";
import { SquareStack } from "@/components/icons/SquareStack";
import { OauthEnvironment } from "@/types";

type Props = {
  state: OauthEnvironment["state"];
  onAuthorize: () => void;
  onClear: () => void;
  onRefresh: () => void;
};
export function OauthState({ state, onAuthorize, onClear, onRefresh }: Props) {
  const [, copyToClipboard] = useCopyToClipboard();

  const expired = state?.expires && state.expires < new Date();
  return (
    <div className="flex flex-col gap-2 bg-base-200 p-2 rounded">
      <div className="flex justify-center gap-2">
        <button className="btn btn-ghost" disabled={!state} onClick={onClear}>
          Clear
        </button>
        <button className="btn btn-secondary" onClick={onAuthorize}>
          Authorize
        </button>
      </div>
      {state && (
        <>
          <label
            className={clsx("input input-ghost flex items-center gap-2 px-1", {
              "input-error": expired,
            })}
          >
            <div
              className={clsx("tooltip tooltip-right mx-px p-1", {
                "text-success": !expired && state.expires,
                "text-error": expired,
              })}
              data-tip={
                state.expires
                  ? [
                      expired ? "Expired" : "Expires",
                      state.expires.toISOString(),
                    ].join(" ")
                  : "No expiration"
              }
            >
              {expired ? (
                <ExclamationTriangle />
              ) : state.expires ? (
                <CheckCircle />
              ) : (
                <QuestionMarkCircle />
              )}
            </div>
            <span className="w-32">Access Token</span>
            <input
              type="text"
              className="grow bg-base-200 focus:bg-base-100"
              value={state.accessToken ?? ""}
            />
            <button
              className="btn btn-sm btn-ghost px-1"
              disabled={!state.accessToken}
              onClick={() => copyToClipboard(state.accessToken ?? "")}
            >
              <SquareStack />
            </button>
          </label>
          <label className="input input-ghost flex items-center gap-2 px-1">
            {state.refreshToken ? (
              <button
                className="btn btn-sm btn-ghost px-1"
                disabled={!state.refreshToken}
                onClick={onRefresh}
              >
                <ArrowPath />
              </button>
            ) : (
              <button className="btn btn-sm btn-ghost px-1 invisible">
                <span className="w-6" />
              </button>
            )}
            <span className="w-32">Refresh Token</span>
            <input
              type="text"
              className="grow bg-base-200 focus:bg-base-100"
              value={state.refreshToken ?? ""}
            />
            {state.refreshToken && (
              <button
                className="btn btn-sm btn-ghost px-1"
                disabled={!state.refreshToken}
                onClick={() => copyToClipboard(state.refreshToken ?? "")}
              >
                <SquareStack />
              </button>
            )}
          </label>
          <label className="input input-ghost flex items-center gap-2 px-1">
            <button className="btn btn-sm btn-ghost px-1 invisible">
              <span className="w-6" />
            </button>
            <span className="w-32">Scope</span>
            <input
              type="text"
              className="grow bg-base-200 focus:bg-base-100"
              value={state.scope ?? ""}
            />
          </label>
        </>
      )}
    </div>
  );
}
