import { ElementRef, useRef } from "react";
import clsx from "clsx";

import { Environment } from "@/types";

type Props = {
  environments: Environment[];
  selectedEnvironment?: Environment;
  setSelectedEnvironment: (id?: string) => void;
};

export function EnvironmentDropdown(props: Props) {
  const dropdownRef = useRef<ElementRef<"details">>(null);

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end">
      <summary
        className={clsx("btn btn-sm", {
          "text-neutral-content": !props.selectedEnvironment,
        })}
      >
        {props.selectedEnvironment
          ? props.selectedEnvironment.name
          : "[no env]"}
      </summary>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        {props.selectedEnvironment && (
          <li className="text-neutral-content">
            <a
              className="justify-center"
              onClick={() => {
                dropdownRef.current?.removeAttribute("open");
                props.setSelectedEnvironment();
              }}
            >
              [clear]
            </a>
          </li>
        )}
        {props.environments.map((env) => (
          <li key={env.id}>
            <a
              onClick={() => {
                dropdownRef.current?.removeAttribute("open");
                props.setSelectedEnvironment(env.id);
              }}
            >
              {env.name}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
