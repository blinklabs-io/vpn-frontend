import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  showConfirm?: boolean;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Close",
  showConfirm = true,
  showCancel = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const DRAG_DISMISS_THRESHOLD = 200;
  const DRAG_MAX_PULL = 260;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (isOpen) setIsVisible(true);
    });
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      cancelAnimationFrame(frame);
      setIsVisible(false);
      document.body.style.overflow = previousOverflow;
      setDragOffset(0);
      setDragStartY(null);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDragStart = (clientY?: number) => {
    if (typeof clientY !== "number") return;
    setDragStartY(clientY);
    setDragOffset(0);
  };

  const handleDragMove = (clientY?: number) => {
    if (dragStartY === null || typeof clientY !== "number") return;
    const delta = Math.max(0, clientY - dragStartY);
    setDragOffset(Math.min(delta, DRAG_MAX_PULL));
  };

  const handleDragEnd = () => {
    if (dragOffset > DRAG_DISMISS_THRESHOLD) {
      onCancel();
    } else {
      setDragOffset(0);
    }
    setDragStartY(null);
  };

  const transformValue = `${
    isVisible ? "translateY(0%)" : "translateY(100%)"
  } translateY(${dragOffset}px)`;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-0 md:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className="absolute inset-0" onClick={onCancel} aria-hidden />
      <div
        className={`${
          isVisible ? "translate-y-0" : "translate-y-full"
        } md:translate-y-0 absolute bottom-0 left-0 right-0 md:relative md:bottom-auto w-full md:max-w-lg bg-white text-slate-900 rounded-t-2xl md:rounded-xl shadow-2xl transition-transform duration-300 ease-out transform overflow-hidden pb-[env(safe-area-inset-bottom)] max-h-[90vh] min-h-[70vh] md:min-h-0 md:max-h-none flex flex-col`}
        style={{ transform: transformValue }}
        onTouchStart={(e) => handleDragStart(e.touches[0]?.clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0]?.clientY)}
        onTouchEnd={handleDragEnd}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onMouseMove={(e) => handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => dragStartY !== null && handleDragEnd()}
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-1.5 w-20 rounded-full bg-gray-200 md:hidden" />
        <div className="p-6 md:p-6 pt-12 md:pt-6 flex flex-col flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {message && (
            <div className="mt-2 text-sm text-gray-600">
              {typeof message === "string" ? <p>{message}</p> : message}
            </div>
          )}
          <div className="mt-auto md:mt-6 flex flex-col-reverse md:flex-row md:justify-end gap-2.5 pt-6">
            {showCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-11 md:h-9 md:rounded-md w-full md:w-auto rounded-full bg-[#9400FF] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 cursor-pointer"
              >
                {cancelLabel}
              </button>
            )}
            {showConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                className="h-11 md:h-9 md:rounded-md w-full md:w-auto rounded-full bg-[#9400FF] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 cursor-pointer"
              >
                {confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
