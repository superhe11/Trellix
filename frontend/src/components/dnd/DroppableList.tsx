import React, { memo, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DraggableCard } from "./DraggableCard";
import type { List, Card as CardType } from "@/types";

interface DroppableListProps {
  list: List;
  onAddCard: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onRemoveCard: (cardId: string) => void;
  canManageLists: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  canManageAllCards: boolean;
  onEditCard: (card: CardType) => void;
  onToggleFavoriteTag?: (cardId: string, tagId: string, isFavorite: boolean) => void;
}

export const DroppableList = memo(function DroppableList({
  list,
  onAddCard,
  onDeleteList,
  onRemoveCard,
  canManageLists,
  currentUserId,
  currentUserRole,
  canManageAllCards,
  onEditCard,
  onToggleFavoriteTag,
}: DroppableListProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: list.id,
    data: {
      type: "list",
      list,
    },
  });

  const cardCount = list.cards.length;
  const cardIds = list.cards.map((card) => card.id);

  // Определяем, перетаскивается ли карточка над этим списком
  const isDraggedOver = isOver && active?.data.current?.type === "card";
  
  // Определяем, является ли перетаскиваемый элемент карточкой из этого списка
  const isDraggingFromThisList = active?.data.current?.type === "card" && 
    list.cards.some(card => card.id === active.id);

  return (
    <section
      ref={setNodeRef}
      className={`
        flex min-w-[280px] max-w-[340px] flex-col gap-4 rounded-3xl border p-4
        transition-all duration-300 ease-out
        ${isDraggedOver
          ? "list-drag-over border-blue-400/60 bg-blue-50/10 shadow-xl scale-[1.02] ring-2 ring-blue-300/40 drop-zone-active"
          : "border-white/5 bg-white/5 hover:border-white/10"
        }
        ${isDraggingFromThisList ? "opacity-90 scale-[0.98]" : ""}
      `}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="text-base font-medium text-white leading-relaxed">
            {list.title}
          </h2>
          <p className="text-xs uppercase text-slate-500 tracking-wider">
            Карточек: {cardCount}
          </p>
        </div>
        {canManageLists && (
          <button
            className="rounded-full p-2 text-slate-500 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:scale-110"
            onClick={() => onDeleteList(list.id)}
            title="Удалить список"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <div
        className={`
          min-h-[100px] max-h-[70vh] overflow-y-auto relative
          transition-all duration-300 ease-out rounded-2xl
          ${isDraggedOver ? "bg-blue-50/5 p-2 ring-1 ring-blue-300/20" : "p-1"}
        `}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {list.cards.map((card, index) => (
              <DraggableCard
                key={card.id}
                card={card}
                index={index}
                onRemove={onRemoveCard}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                canManageAllCards={canManageAllCards}
                onEdit={onEditCard}
                listTitle={list.title}
                onToggleFavorite={onToggleFavoriteTag}
              />
            ))}
          </div>
        </SortableContext>

        {!list.cards.length && !isDraggedOver && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-slate-500 transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span>Карточек пока нет</span>
            </div>
          </div>
        )}

        {isDraggedOver && !list.cards.length && (
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/10 p-6 text-center text-xs text-primary-foreground transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span>Отпустите, чтобы добавить карточку</span>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-center transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-105"
        onClick={() => onAddCard(list.id)}
      >
        <Plus className="h-4 w-4" /> Добавить карточку
      </Button>
    </section>
  );
});