"use client";

import { trpc } from "@/utils/trpcClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function ClientProviders(props: { children: React.ReactNode }) {
  return (
    <>
      {props.children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </>
  );
}

export default trpc.withTRPC(
  ClientProviders
) as React.FC<React.PropsWithChildren>;
