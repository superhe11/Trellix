import React, { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Card as CardType } from "@/types";

interface DraggableCardProps {
  card: CardType;
  index: number;
  onRemove: (cardId: string) => void;
  currentUserId?: string;
  currentUserRole?: string;
  canManageAllCards: boolean;
  onEdit: (card: CardType) => void;
}

function areCardPropsEqual(prev: DraggableCardProps, next: DraggableCardProps) {
  return (
    prev.card.id === next.card.id &&
    prev.card.title === next.card.title &&
    prev.card.status === next.card.status &&
    prev.card.dueDate === next.card.dueDate &&
    prev.index === next.index &&
    prev.canManageAllCards === next.canManageAllCards &&
    prev.currentUserId === next.currentUserId &&
    prev.currentUserRole === next.currentUserRole
  );
}

export const DraggableCard = memo(function DraggableCard({
  card,
  index,
  onRemove,
  currentUserId,
  currentUserRole,
  canManageAllCards,
  onEdit,
}: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
      index,
    },
  });

  // Кэшируем вычисление canManageCard для избежания повторных вычислений
  const canManageCard = useMemo(
    () =>
      canManageAllCards ||
      (currentUserRole !== "EMPLOYEE" && !!currentUserRole) ||
      card.createdBy.id === currentUserId,
    [canManageAllCards, currentUserRole, card.createdBy.id, currentUserId]
  );

  // Кэшируем статус карточки для избежания повторных вычислений
  const cardStatus = useMemo(() => renderStatus(card), [card.status]);

  // Кэшируем дату для избежания повторных форматирований
  const formattedDate = useMemo(
    () =>
      card.dueDate
        ? format(new Date(card.dueDate), "d MMM", { locale: ru })
        : null,
    [card.dueDate]
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging 
      ? "none" 
      : "transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms ease",
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0 : 1, // Полностью скрываем оригинальную карточку
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      id={`card-${card.id}`}
      className={`
        group select-none rounded-2xl border bg-surface/80 p-4 text-left shadow-lg 
        card-transition cursor-grab active:cursor-grabbing
        hover:card-hover hover:border-blue-300/50
        ${isDragging 
          ? "drag-start shadow-2xl border-blue-400/60 bg-surface/90 scale-105" 
          : "hover:shadow-xl"
        }
        ${isOver ? "ring-2 ring-blue-400/40 ring-offset-2" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white leading-relaxed">
            {card.title}
          </p>
        </div>
        {canManageCard && (
          <div className="flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
            <button
              className="rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-110"
              title="Редактировать карточку"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              className="rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:scale-110"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(card.id);
              }}
              title="Удалить карточку"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {card.description && (
        <p className="mt-3 line-clamp-3 text-xs text-slate-400 leading-relaxed">
          {card.description}
        </p>
      )}
      
      <footer className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Tag className="h-3 w-3" /> 
          {cardStatus}
        </span>
        {formattedDate && (
          <span className="px-2 py-1 rounded-md bg-white/5 text-slate-400">
            {formattedDate}
          </span>
        )}
      </footer>
    </div>
  );
}, areCardPropsEqual);

function renderStatus(card: CardType) {
  switch (card.status) {
    case "IN_PROGRESS":
      return <Badge variant="outline" className="text-blue-400 border-blue-400/30">В работе</Badge>;
    case "REVIEW":
      return <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">На проверке</Badge>;
    case "DONE":
      return <Badge variant="success" className="text-green-400 border-green-400/30">Готово</Badge>;
    default:
      return <Badge variant="outline" className="text-slate-400 border-slate-400/30">К выполнению</Badge>;
  }
}