
import { useCallback, useRef, useState, type ReactNode } from "react";
import { ToastContext, type Toast, type ToastType } from "./toast";
import { useMemo } from "react";
import Toaster from "../components/Toaster";

// How long the toast appears
const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {

    const [toasts, setToasts] = useState<Toast[]>([]);
    // Id's increment so each toast can be removed individually
    const nextId = useRef<number>(0);   // Start counting IDs at 0

    // Clear the toast with the given ID
    const dismissToast = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    // Display a toast, default type is "success"
    const showToast = useCallback((message: string, type: ToastType = "success", durationMs: number = TOAST_DURATION_MS ) => {
        const id = nextId.current;
        // Update the next ID
        nextId.current += 1;

        setToasts((current) => [...current, {id, message, type}]);

        // Set a timer and clear the toast after the time has elapsed.
        window.setTimeout(() => dismissToast(id), durationMs);
    }, [dismissToast]);

    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Toaster toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    )



}