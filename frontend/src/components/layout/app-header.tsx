import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { Avatar } from "@/components/ui/avatar";

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [isOpen, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: results } = useQuery({
    queryKey: ["search-cards", q],
    queryFn: async () => {
      if (!q || q.trim().length < 2) return [] as Array<{ id: string; title: string; boardId: string; listTitle: string; boardTitle: string }>;
      const res = await apiClient.get<{ cards: Array<{ id: string; title: string; boardId: string; listTitle: string; boardTitle: string }> }>(
        `/cards`,
        { params: { q, limit: 8 } }
      );
      return res.data.cards;
    },
    staleTime: 0,
  });
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
            <Input
              ref={inputRef}
              className="w-72 bg-white/10 pl-9"
              placeholder="Поиск по задачам..."
              value={q}
              onChange={(e) => {
                const value = e.target.value;
                setQ(value);
                setOpen(value.trim().length >= 2);
              }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onFocus={() => q.trim().length >= 2 && setOpen(true)}
            />
            {isOpen && results && results.length > 0 && (
              <div className="absolute right-0 z-50 mt-2 w-[28rem] overflow-hidden rounded-2xl border border-white/10 bg-surface/90 shadow-xl backdrop-blur">
                <ul className="max-h-80 divide-y divide-white/5 overflow-auto">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setOpen(false);
                          setQ("");
                          navigate(`/boards/${r.boardId}?cardId=${r.id}`);
                        }}
                      >
                        <div className="truncate font-medium text-white">{r.title}</div>
                        <div className="truncate text-xs text-slate-500">{r.boardTitle} • {r.listTitle}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
