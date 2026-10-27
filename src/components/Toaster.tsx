import type { Toast } from "../context/toast";
import './styles/Toast.css';

interface ToasterProps {
    toasts: Toast[];
    onDismiss: (id: number) => void;
}

export default function Toaster({ toasts, onDismiss }: ToasterProps) {
    return (
        <div className="toaster">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span>{toast.message}</span>

                    <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)}>
                        x
                    </button>
                </div>
            ))}

        </div>
    )
}
