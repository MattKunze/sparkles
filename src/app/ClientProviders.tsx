"use client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";

import { trpc } from "@/utils/trpcClient";

function ClientProviders(props: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>{props.children}</SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </>
  );
}

export default trpc.withTRPC(
  ClientProviders
) as React.FC<React.PropsWithChildren>;
