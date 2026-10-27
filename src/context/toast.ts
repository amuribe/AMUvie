import { createContext, useContext } from "react";

export type ToastType = "success" | "error";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

export interface ToastContextType {
    showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

// Initialized to null
export const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);

    if (context == null) {
        throw new Error("useToas must be used within a ToastProvider");
    }

    return context;
}