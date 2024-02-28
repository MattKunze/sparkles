"use client";
import { useState } from "react";
import clsx from "clsx";

import { EllipsisVertical } from "@/components/icons/EllipsisVertical";

type Props = React.PropsWithChildren<{
  sideContent: React.ReactNode;
}>;

export function Drawer(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(true);

  const toggle = () => setDrawerOpen(!drawerOpen);

  return (
    <div
      className={clsx("drawer relative", {
        "drawer-open": drawerOpen,
      })}
    >
      <Sep className="sticky top-0 left-0 h-screen" toggle={toggle} />
      <input
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={() => {}}
      />
      <div className="drawer-content p-2">{props.children}</div>
      <div className="drawer-side !flex flex-row">
        {props.sideContent}
        <Sep className="relative h-full" toggle={toggle} />
      </div>
    </div>
  );
}

function Sep({ className, toggle }: { className: string; toggle: () => void }) {
  return (
    <div
      className={`${className} w-3 text-base-300 hover:bg-base-200 hover:text-base-400 cursor-pointer`}
      onClick={toggle}
    >
      <EllipsisVertical className="absolute top-1/2 -left-1.5" />
    </div>
  );
}
