import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(15, 23, 42, 0.92)",
          color: "#f8fafc",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          backdropFilter: "blur(12px)",
        },
      }}
    />
  );
}
