import clsx from "clsx";

import { CheckCircle } from "@/components/icons/CheckCircle";
import { ExclamationTriangle } from "@/components/icons/ExclamationTriangle";
import { InformationCircle } from "@/components/icons/InformationCircle";
import { XCircle } from "@/components/icons/XCircle";

import { Toast, ToastInternal, ToastContextInterface } from "./types";

type Props = {
  toasts: ToastInternal[];
  dismissToast: ToastContextInterface["dismissToast"];
};
export function ToastContainer({ toasts, dismissToast }: Props) {
  return (
    <div className="toast toast-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx("alert", {
            "alert-error": toast.type === "error",
            "alert-info": toast.type === "info",
            "alert-success": toast.type === "success",
            "alert-warning": toast.type === "warning",
          })}
          onClick={() => dismissToast(toast.id)}
        >
          {renderIcon(toast)}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function renderIcon(toast: Toast) {
  if (toast.icon === true) {
    switch (toast.type) {
      case "success":
        return <CheckCircle />;
      case "error":
        return <XCircle />;
      case "warning":
        return <ExclamationTriangle />;
      default:
        return <InformationCircle />;
    }
  }

  return toast.icon ?? null;
}
