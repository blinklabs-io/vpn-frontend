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

export const showCopyableUrl = (
  url: string,
  message: string = "Download link ready!",
  options?: ToastOptions,
) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    showSuccess("URL copied to clipboard!");
  };

  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-[#1C246E] shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-white/20 backdrop-blur-xl border-l-4 border-purple-500`}
        style={{
          minWidth: "320px",
        }}
      >
        <div className="flex-1 p-4 min-w-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img className="h-6 w-6" src="/nabu-circle-icon.svg" alt="Nabu" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white break-words">
                  {message}
                </p>
              </div>
            </div>
            <div className="bg-black/30 rounded-md p-2 text-xs text-white/80 font-mono overflow-hidden">
              <p className="truncate">{url}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy URL
            </button>
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
    { ...defaultOptions, duration: 10000, ...options },
  );
};

export { toast };
