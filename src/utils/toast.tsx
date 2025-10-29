import toast, { type ToastOptions } from "react-hot-toast";

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: "bottom-center",
  style: {
    marginBottom: "3rem",
  },
};

export const showSuccess = (message: string, options?: ToastOptions) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-[#1C246E] shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-white/20 backdrop-blur-xl border-l-4 border-green-500`}
        style={{
          minWidth: "300px",
        }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img className="h-6 w-6" src="/nabu-circle-icon.svg" alt="Nabu" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white break-words">
                {message.length > 100
                  ? `${message.substring(0, 100)}...`
                  : message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-white/20">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            ✕
          </button>
        </div>
      </div>
    ),
    { ...defaultOptions, ...options },
  );
};

export const showError = (message: string, options?: ToastOptions) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-[#1C246E] shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-white/20 backdrop-blur-xl border-l-4 border-red-500`}
        style={{
          minWidth: "300px",
        }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img className="h-6 w-6" src="/nabu-circle-icon.svg" alt="Nabu" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white break-words">
                {message.length > 100
                  ? `${message.substring(0, 100)}...`
                  : message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-white/20">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            ✕
          </button>
        </div>
      </div>
    ),
    { ...defaultOptions, ...options },
  );
};

export const showInfo = (message: string, options?: ToastOptions) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-[#1C246E] shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-white/20 backdrop-blur-xl border-l-4 border-blue-500`}
        style={{
          minWidth: "300px",
        }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img className="h-6 w-6" src="/nabu-circle-icon.svg" alt="Nabu" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white break-words">
                {message.length > 100
                  ? `${message.substring(0, 100)}...`
                  : message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-white/20">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            ✕
          </button>
        </div>
      </div>
    ),
    { ...defaultOptions, ...options },
  );
};

export { toast };
