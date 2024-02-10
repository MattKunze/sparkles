"use client";
import { createContext, useContext, useEffect, useState } from "react";

import { ToastContainer } from "./ToastContainer";
import { Toast, ToastInternal, ToastContextInterface } from "./types";

export const ToastContext = createContext<ToastContextInterface>({
  showToast: () => "",
  dismissToast: () => {},
});

export function useToastContext() {
  return useContext(ToastContext);
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const showToast = (toast: Toast) => {
    const id = Date.now().toString();
    setToasts([
      {
        id,
        expires: toast.delay ? Date.now() + toast.delay : undefined,
        ...toast,
      },
      ...toasts,
    ]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  // dismiss next expiring toast
  useEffect(() => {
    const min = Math.min(...toasts.map((toast) => toast.expires ?? Infinity));

    if (min < Infinity) {
      const id = setTimeout(() => {
        setToasts(
          toasts.filter(
            (toast) => !toast.expires || toast.expires >= Date.now()
          )
        );
      }, min - Date.now());

      return () => clearTimeout(id);
    }
  }, [toasts]);

  // Value to be provided by the context
  const value = {
    showToast,
    dismissToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
};
