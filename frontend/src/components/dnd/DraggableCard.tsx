import React, { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, Plus } from "lucide-react";
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
  listTitle?: string;
  onToggleFavorite?: (cardId: string, tagId: string, isFavorite: boolean) => void;
}

function areCardPropsEqual(prev: DraggableCardProps, next: DraggableCardProps) {
  // Сравниваем теги
  const prevTagsLength = prev.card.tags?.length || 0;
  const nextTagsLength = next.card.tags?.length || 0;
  
  if (prevTagsLength !== nextTagsLength) {
    return false;
  }
  
  // Если есть теги, сравниваем их содержимое
  if (prevTagsLength > 0 && nextTagsLength > 0) {
    const prevTagIds = prev.card.tags?.map(ct => ct.tag.id).sort().join(',') || '';
    const nextTagIds = next.card.tags?.map(ct => ct.tag.id).sort().join(',') || '';
    
    if (prevTagIds !== nextTagIds) {
      return false;
    }
  }
  
  return (
    prev.card.id === next.card.id &&
    prev.card.title === next.card.title &&
    prev.card.description === next.card.description &&
    prev.card.updatedAt === next.card.updatedAt &&
    prev.index === next.index &&
    prev.currentUserId === next.currentUserId &&
    prev.currentUserRole === next.currentUserRole &&
    prev.canManageAllCards === next.canManageAllCards
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02] ${
        isOver ? "ring-2 ring-primary/50" : ""
      }`}
      onClick={() => onEdit(card)}
    >
      {/* Заголовок с кнопками управления */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Название карточки - крупно, без подписи */}
          <h3 className="text-lg font-semibold text-white leading-tight break-words">
            {card.title}
          </h3>
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
      
      {/* Описание - основной блок */}
      {card.description && (
        <div className="mb-4">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {card.description}
          </p>
        </div>
      )}
      
      {/* Теги внизу */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {card.tags && card.tags.length > 0 ? (
            (() => {
              const sortedTags = card.tags
                .slice()
                .sort((a, b) => a.position - b.position);
              
              const firstTag = sortedTags[0];
              const remainingCount = sortedTags.length - 1;
              
              return (
                <div className="flex items-center gap-2">
                  <Badge
                    key={firstTag.tag.id}
                    variant="outline"
                    className="text-xs border-slate-400/30"
                    style={firstTag.tag.color ? { 
                      borderColor: firstTag.tag.color, 
                      color: firstTag.tag.color 
                    } : undefined}
                  >
                    {firstTag.tag.name}
                  </Badge>
                  {remainingCount > 0 && (
                    <span className="text-xs text-slate-400">
                      +{remainingCount}
                    </span>
                  )}
                </div>
              );
            })()
          ) : (
            <span className="text-xs text-slate-500">Нет тегов</span>
          )}
        </div>
        
        {/* Кнопка + для назначения тегов */}
        <button
          className="rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-110"
          title="Назначить теги"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(card);
          }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}, areCardPropsEqual);