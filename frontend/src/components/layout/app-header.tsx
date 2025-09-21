import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

export function AppHeader() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const title = useMemo(() => {
    if (location.pathname.startsWith("/boards")) {
      return "Рабочие пространства";
    }

    if (location.pathname.startsWith("/admin")) {
      return "Панель администратора";
    }

    return "Главная";
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{title}</p>
          <h2 className="text-lg font-medium text-white">{renderMoodline(location.pathname)}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input className="w-64 bg-white/10 pl-9" placeholder="Поиск по задачам..." />
          </div>
          {user && (
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <Avatar name={user.fullName} size="sm" />
              <div>
                <p className="text-sm font-semibold text-white">{user.fullName}</p>
                <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Администратор";
    case "LEAD":
      return "Руководитель";
    default:
      return "Сотрудник";
  }
}

function renderMoodline(pathname: string) {
  if (pathname.startsWith("/boards")) {
    return "Держите задачи команды под контролем.";
  }
  if (pathname.startsWith("/admin")) {
    return "Управляйте пользователями и ролями.";
  }
  return "Следите за прогрессом команды.";
}
