/**
 * A tiny, dependency-free toast store with a sonner-like API.
 *
 *   toast("متن")
 *   toast.success("ذخیره شد", { description: "..." })
 *   toast.error(...) / .warning(...) / .info(...) / .loading(...)
 *   toast.promise(p, { loading, success, error })
 *   toast.custom((id) => <MyNode />)
 *   toast.dismiss(id?)
 *
 * The store is framework-agnostic; <Toaster /> subscribes to it.
 */
import type { ReactNode } from "react";

export type ToastType =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export type ToastAction = {
  label: ReactNode;
  onClick: (id: ToastId) => void;
};

export type ToastId = string | number;

export type ToastOptions = {
  id?: ToastId;
  description?: ReactNode;
  /** ms. `Infinity` (or 0) keeps it until dismissed. Loading defaults to Infinity. */
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: (id: ToastId) => void;
  onAutoClose?: (id: ToastId) => void;
};

export type ToastRecord = ToastOptions & {
  id: ToastId;
  type: ToastType;
  title: ReactNode;
  /** Fully custom body; when set, title/description/icon are ignored. */
  render?: (id: ToastId) => ReactNode;
  createdAt: number;
};

type Listener = (toasts: ToastRecord[]) => void;

const DEFAULT_DURATION = 4000;

let counter = 0;
let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();

const emit = () => {
  const snapshot = toasts;
  listeners.forEach((listener) => listener(snapshot));
};

export const subscribeToToasts = (listener: Listener) => {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
};

export const getToasts = () => toasts;

const upsert = (record: ToastRecord) => {
  const existing = toasts.findIndex((t) => t.id === record.id);
  if (existing > -1) {
    const next = toasts.slice();
    next[existing] = { ...next[existing], ...record };
    toasts = next;
  } else {
    toasts = [record, ...toasts];
  }
  emit();
  return record.id;
};

const dismiss = (id?: ToastId) => {
  if (id === undefined) {
    toasts.forEach((t) => t.onDismiss?.(t.id));
    toasts = [];
  } else {
    const target = toasts.find((t) => t.id === id);
    target?.onDismiss?.(id);
    toasts = toasts.filter((t) => t.id !== id);
  }
  emit();
};

/** Called by <Toaster /> when a timer runs out, so callbacks stay accurate. */
export const autoClose = (id: ToastId) => {
  const target = toasts.find((t) => t.id === id);
  target?.onAutoClose?.(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

export const resolveDuration = (record: ToastRecord) => {
  if (record.duration === undefined) {
    return record.type === "loading" ? Infinity : DEFAULT_DURATION;
  }
  if (record.duration === 0) return Infinity;
  return record.duration;
};

const create =
  (type: ToastType) =>
    (title: ReactNode, options: ToastOptions = {}): ToastId => {
      const id = options.id ?? `toast-${++counter}`;
      return upsert({
        dismissible: true,
        ...options,
        id,
        type,
        title,
        createdAt: Date.now(),
      });
    };

const base = create("default");

type PromiseMessages<T> = {
  loading: ReactNode;
  success: ReactNode | ((value: T) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
};

export const toast = Object.assign(base, {
  success: create("success"),
  error: create("error"),
  warning: create("warning"),
  info: create("info"),
  loading: create("loading"),
  message: base,

  custom: (render: (id: ToastId) => ReactNode, options: ToastOptions = {}) => {
    const id = options.id ?? `toast-${++counter}`;
    return upsert({
      dismissible: true,
      ...options,
      id,
      type: "default",
      title: null,
      render,
      createdAt: Date.now(),
    });
  },

  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: PromiseMessages<T>,
    options: ToastOptions = {},
  ) => {
    const id = options.id ?? `toast-${++counter}`;
    create("loading")(messages.loading, { ...options, id });

    const run = typeof promise === "function" ? promise() : promise;

    run.then(
      (value) => {
        create("success")(
          typeof messages.success === "function"
            ? messages.success(value)
            : messages.success,
          { ...options, id },
        );
      },
      (error) => {
        create("error")(
          typeof messages.error === "function"
            ? messages.error(error)
            : messages.error,
          { ...options, id },
        );
      },
    );

    return run;
  },

  dismiss,
});
