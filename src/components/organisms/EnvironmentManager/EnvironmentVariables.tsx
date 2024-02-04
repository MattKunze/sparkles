import { useState } from "react";

import { XMark } from "@/components/icons/XMark";
import { Environment } from "@/types";

type Props = {
  env: Environment;
  onChange: (updated: Environment) => void;
};
export function EnvironmentVariables(props: Props) {
  const [newName, setNewName] = useState("");

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th className="w-full">Value</th>
          <th>Secret</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(props.env.variables).map(([name, value], index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                className="input input-bordered input-sm font-mono"
                value={name}
                disabled
              />
            </td>
            <td>
              <input
                type={value.type === "secret" ? "password" : "text"}
                className="input input-bordered input-sm font-mono w-full"
                defaultValue={value.value}
                onBlur={(e) =>
                  performUpdate(props, {
                    type: "updateValue",
                    name,
                    value: e.target.value,
                  })
                }
              />
            </td>
            <td>
              <input
                type="checkbox"
                className="toggle toggle-accent"
                checked={value.type === "secret"}
                onChange={(e) =>
                  performUpdate(props, {
                    type: "updateSecret",
                    name,
                    secret: e.target.checked,
                  })
                }
              />
            </td>
            <td className="px-0">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => performUpdate(props, { type: "delete", name })}
              >
                <XMark />
              </button>
            </td>
          </tr>
        ))}
        <tr>
          <td>
            <input
              type="text"
              className="input input-bordered input-sm font-mono"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => {
                if (newName) {
                  performUpdate(props, { type: "create", name: newName });
                  setNewName("");
                }
              }}
            />
          </td>
          <td>
            <input
              type="text"
              className="input input-bordered input-sm font-mono w-full"
              disabled
            />
          </td>
          <td>
            <input type="checkbox" className="toggle" disabled />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const performUpdate = (
  props: Props,
  action:
    | {
        type: "create" | "delete";
        name: string;
      }
    | {
        type: "updateValue";
        name: string;
        value: string;
      }
    | {
        type: "updateSecret";
        name: string;
        secret: boolean;
      }
) => {
  const updated = { ...props.env, variables: { ...props.env.variables } };
  switch (action.type) {
    case "create":
      updated.variables[action.name] = { value: "", type: "plain" };
      break;
    case "delete":
      delete updated.variables[action.name];
      break;
    case "updateValue":
      updated.variables[action.name].value = action.value;
      break;
    case "updateSecret":
      updated.variables[action.name].type = action.secret ? "secret" : "plain";
      break;
  }
  props.onChange(updated);
};
