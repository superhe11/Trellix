import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
    ? error.message
    : "Что-то пошло не так";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface text-surface-foreground">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-semibold">Упс!</h1>
        <p className="mt-2 text-slate-400">{message}</p>
        <Button className="mt-6" onClick={() => (window.location.href = "/boards")}>Вернуться к доскам</Button>
      </div>
    </div>
  );
}
