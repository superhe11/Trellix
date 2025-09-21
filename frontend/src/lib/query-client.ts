import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if ((error as any)?.response?.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
