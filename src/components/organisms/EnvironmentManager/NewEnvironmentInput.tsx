import { useState } from "react";

import { ShieldCheck } from "@/components/icons/ShieldCheck";
import { TableCells } from "@/components/icons/TableCells";
import { EnvironmentType, EnvironmentTypes } from "@/types";

export const TypeIcons: Record<EnvironmentType, JSX.Element> = {
  kvp: <TableCells />,
  oauth: <ShieldCheck />,
};

type Props = {
  createEnv: (input: { name: string; type: EnvironmentType }) => void;
};
export function NewEnvironmentInput(props: Props) {
  const [newEnvironmentName, setNewEnvironmentName] = useState("");

  const create = (type: EnvironmentType) => {
    props.createEnv({ name: newEnvironmentName, type });
    setNewEnvironmentName("");
  };

  return (
    <div className="join">
      <input
        className="input input-bordered input-sm join-item"
        placeholder="Create..."
        value={newEnvironmentName}
        onChange={(e) => setNewEnvironmentName(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            create("kvp");
          }
        }}
      />
      {EnvironmentTypes.map((type) => (
        <button
          key={type}
          className="btn btn-sm px-1 join-item"
          disabled={!newEnvironmentName}
          onClick={() => create(type)}
        >
          {TypeIcons[type]}
        </button>
      ))}
    </div>
  );
}
