"use client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";

import { ModalPromptProvider } from "@/components/hooks/useModalPrompt";
import { ToastProvider } from "@/components/organisms/ToastContext";
import { trpc } from "@/utils/trpcClient";

function ClientProviders(props: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>
        <ModalPromptProvider>
          <ToastProvider>{props.children}</ToastProvider>
        </ModalPromptProvider>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </>
  );
}

export default trpc.withTRPC(
  ClientProviders
) as React.FC<React.PropsWithChildren>;
