import Navigation from "./components/Navigation";
import AppRoutes from "./routes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api";

const VpnApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="flex flex-col min-h-screen"
        style={{
          backgroundColor: "#040617",
          backgroundImage:
            "linear-gradient(180deg, rgba(28, 36, 110, 0.45) 0%, rgba(4, 6, 23, 0.65) 35%), url('/hero-backdrop.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundAttachment: "fixed",
        }}
      >
        <Navigation />
        <AppRoutes />
      </div>
    </QueryClientProvider>
  );
};

export default VpnApp;
