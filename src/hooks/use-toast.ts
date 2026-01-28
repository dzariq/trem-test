import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 600;

const DEFAULT_DURATIONS = {
  success: 2000,
  info: 3500,
  error: 5000,
  destructive: 5000,
  default: 2000,
} as const;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const clearAutoDismiss = (toastId?: string) => {
  if (!toastId) {
    autoDismissTimeouts.forEach((timeout) => clearTimeout(timeout));
    autoDismissTimeouts.clear();
    return;
  }
  const timeout = autoDismissTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    autoDismissTimeouts.delete(toastId);
  }
};

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        clearAutoDismiss(toastId);
      } else {
        clearAutoDismiss();
      }
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      clearAutoDismiss(action.toastId);
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

const resolveDuration = (variant?: ToastProps["variant"], duration?: number) => {
  if (typeof duration === "number") return duration;
  const key = variant ?? "default";
  if (key === "success") return DEFAULT_DURATIONS.success;
  if (key === "info") return DEFAULT_DURATIONS.info;
  if (key === "error") return DEFAULT_DURATIONS.error;
  if (key === "destructive") return DEFAULT_DURATIONS.destructive;
  return DEFAULT_DURATIONS.default;
};

type ToastFn = ((props: Toast) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void }) & {
  success: (title: React.ReactNode, description?: React.ReactNode, options?: Omit<Toast, "title" | "description">) => {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
  };
  info: (title: React.ReactNode, description?: React.ReactNode, options?: Omit<Toast, "title" | "description">) => {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
  };
  error: (title: React.ReactNode, description?: React.ReactNode, options?: Omit<Toast, "title" | "description">) => {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
  };
};

const toast = (({ duration, variant = "default", ...props }: Toast) => {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  const resolvedDuration = resolveDuration(variant, duration);
  clearAutoDismiss(id);
  if (resolvedDuration > 0) {
    autoDismissTimeouts.set(
      id,
      setTimeout(() => {
        dismiss();
      }, resolvedDuration)
    );
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      variant,
      duration: resolvedDuration,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}) as ToastFn;

toast.success = (title: React.ReactNode, description?: React.ReactNode, options?: Omit<Toast, "title" | "description">) =>
  toast({ title: title as string & React.ReactNode, description: description as string & React.ReactNode, variant: "success", ...options });
toast.info = (title: React.ReactNode, description?: React.ReactNode, options?: Omit<Toast, "title" | "description">) =>
  toast({ title: title as string & React.ReactNode, description: description as string & React.ReactNode, variant: "info", ...options });
toast.error = (title: React.ReactNode, description?: React.ReactNode, options?: Omit<Toast, "title" | "description">) =>
  toast({ title: title as string & React.ReactNode, description: description as string & React.ReactNode, variant: "error", ...options });

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
