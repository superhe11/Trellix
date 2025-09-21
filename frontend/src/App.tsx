import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/query-client";
import { router } from "@/routes";
import { useAuthStore } from "@/store/auth-store";
import { SplashScreen } from "@/components/shell/splash-screen";
import { Toaster } from "@/components/ui/toaster";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        <RouterProvider router={router} />
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </AppInitializer>
    </QueryClientProvider>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    const initialize = useAuthStore.getState().initialize;
    initialize().catch((error) => {
      console.error("Failed to initialize auth", error);
    });
  }, []); // Empty dependency array - initialize should only run once

  if (!initialized) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
