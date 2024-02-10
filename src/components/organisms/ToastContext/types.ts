export type Toast = {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  icon?: boolean | JSX.Element;
  delay?: number;
};

export type ToastInternal = Toast & { id: string; expires?: number };

export type ToastContextInterface = {
  showToast: (toast: Toast) => string;
  dismissToast: (id: string) => void;
};
