import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, LogOut, Sparkles, Briefcase } from "lucide-react";
import type { UserRole } from "@/types";
import type React from "react";
import clsx from "clsx";
import { useAuthStore } from "@/store/auth-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: UserRole[];
};

const navigation: NavItem[] = [
  {
    label: "Доски",
    to: "/boards",
    icon: LayoutDashboard,
  },
  {
    label: "Проекты",
    to: "/admin/projects",
    icon: Briefcase,
    roles: ["ADMIN"],
  },
  {
    label: "Пользователи",
    to: "/admin/users",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
] as const;

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="hidden w-72 flex-col border-r border-white/5 bg-surface/80 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="rounded-2xl bg-primary/20 p-3 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">Trellix</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workflows</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {navigation
          .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/15 text-white shadow-inner shadow-primary/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
      </nav>
      {user && (
        <div className="border-t border-white/5 px-6 py-6">
          <div className="flex items-center gap-3">
            <Avatar name={user.fullName} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{user.fullName}</p>
              <p className="text-xs uppercase text-slate-500">{roleLabel(user.role)}</p>
            </div>
          </div>
          <Button variant="ghost" className="mt-4 w-full justify-center" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      )}
    </aside>
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
