import React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Card as CardType } from "@/types";

interface DragOverlayProps {
  activeCard: CardType | null;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ activeCard }) => {
  if (!activeCard) return null;

  const formattedDate = activeCard.dueDate
    ? format(new Date(activeCard.dueDate), "d MMM", { locale: ru })
    : null;

  const cardStatus = activeCard.status === "TODO" ? "К выполнению" : 
                    activeCard.status === "IN_PROGRESS" ? "В работе" : 
                    "Выполнено";

  return (
    <div
      className="
        select-none rounded-2xl border border-white/20 bg-surface/60 p-4 text-left shadow-2xl 
        pointer-events-none backdrop-blur-sm opacity-80
        transform transition-all duration-200 ease-out
        animate-pulse
      "
      style={{
        minHeight: "120px",
        zIndex: 9999,
        transform: "rotate(3deg) scale(1.05)",
        animation: "dragFloat 2s ease-in-out infinite alternate, dragLift 0.3s ease-out",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white/90 leading-relaxed">
            {activeCard.title}
          </p>
        </div>
      </div>
      
      {activeCard.description && (
        <p className="mt-3 line-clamp-3 text-xs text-slate-400/80 leading-relaxed">
          {activeCard.description}
        </p>
      )}
      
      <footer className="mt-4 flex items-center justify-between text-xs text-slate-500/80">
        <span className="flex items-center gap-1.5">
          <Tag className="h-3 w-3" /> 
          {cardStatus}
        </span>
        {formattedDate && (
          <span className="px-2 py-1 rounded-md bg-white/10 text-slate-400/80">
            {formattedDate}
          </span>
        )}
      </footer>
    </div>
  );
};