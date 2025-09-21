import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={clsx("relative glass-panel w-full max-w-lg rounded-3xl p-6", className)}>
        {(title || description) && (
          <header className="mb-6 space-y-2">
            {title && <h3 className="text-xl font-semibold text-white">{title}</h3>}
            {description && <p className="text-sm text-slate-400">{description}</p>}
          </header>
        )}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
