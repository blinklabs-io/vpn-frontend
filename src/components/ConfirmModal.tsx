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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className="absolute inset-0" onClick={onCancel} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {message && (
          <div className="mt-2 text-sm text-gray-600">
            {typeof message === "string" ? <p>{message}</p> : message}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9 min-w-[96px] rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
          )}
          {showConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="h-9 min-w-[96px] rounded-md bg-[#9400FF] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
