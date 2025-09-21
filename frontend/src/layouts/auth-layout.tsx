import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_50%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.1),_transparent_55%)]" />
      <div className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-floating">
        <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-primary/40 via-indigo-500/20 to-purple-500/30 p-12 text-white lg:flex">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">Trellix</p>
            <h1 className="mt-6 text-3xl font-semibold">Переосмыслите управление командой</h1>
            <p className="mt-4 text-sm text-white/70">
              Канбан-доски, прозрачные процессы и полный контроль над доступами в одном месте. Создано
              специально для гибких команд.
            </p>
          </div>
          <div className="space-y-2 text-sm text-white/60">
            <p>✔ Мгновенная смена ролей и прав</p>
            <p>✔ Drag and drop без тормозов</p>
            <p>✔ Готово к продакшн-развёртыванию</p>
          </div>
        </div>
        <div className="flex-1 bg-surface/90 p-10 text-slate-200">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
