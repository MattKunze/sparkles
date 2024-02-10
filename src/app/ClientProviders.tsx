"use client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";

import { ToastProvider } from "@/components/organisms/ToastContext";
import { trpc } from "@/utils/trpcClient";

function ClientProviders(props: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </>
  );
}

export default trpc.withTRPC(
  ClientProviders
) as React.FC<React.PropsWithChildren>;
