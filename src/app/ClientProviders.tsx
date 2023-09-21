"use client";

import { trpcClient } from "@/utils/trpcClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function ClientProviders(props: { children: React.ReactNode }) {
  return (
    <>
      {props.children}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default trpcClient.withTRPC(
  ClientProviders
) as React.FC<React.PropsWithChildren>;
