﻿import { useEffect, useState, useCallback, memo, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Trash2, Pencil, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/auth-store";
import { getBoard } from "@/features/boards/api";
import { createList, deleteList } from "@/features/lists/api";
import { createCard, updateCard, deleteCard } from "@/features/cards/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// import { Card as UiCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import type { List, Card as CardType } from "@/types";
// Debug helpers: always log (including production)
const debugCount = (label: string) => { console.count(label); };
const debugLog = (...args: any[]) => { console.log(...args); };
import { MoveCardMutator } from "@/features/cards/components/MoveCardMutator";

const listSchema = z.object({
  title: z.string().min(2, "Минимальная длина — 2 символа"),
});

type ListSchema = z.infer<typeof listSchema>;

const cardSchema = z.object({
  title: z.string().min(2, "Минимальная длина — 2 символа"),
  description: z.string().optional(),
});

type CardSchema = z.infer<typeof cardSchema>;

export function BoardPage() {
  const { boardId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isEmployee = user?.role === "EMPLOYEE";
  const canManageLists = !isEmployee;

  const [cardListId, setCardListId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);

  const { data: board, isLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId!),
    enabled: Boolean(boardId),
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
  });

  // В @hello-pangea/dnd не нужно настраивать сенсоры

  // Scroll and highlight when navigated from search (always register hook)
  useEffect(() => {
    const targetCardId = searchParams.get("cardId");
    if (!targetCardId) return;
    const el = document.getElementById(`card-${targetCardId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/60");
      const t = setTimeout(() => el.classList.remove("ring-2", "ring-primary/60"), 2000);
      return () => clearTimeout(t);
    }
  }, [searchParams, board]);

  const createListMutation = useMutation({
    mutationFn: (payload: { title: string }) => createList(boardId!, payload),
    onSuccess: () => {
      toast.success("Список создан");
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => toast.error("Не удалось создать список"),
  });

  const createCardMutation = useMutation({
    mutationFn: (payload: { listId: string; title: string; description?: string }) =>
      createCard(payload.listId, { title: payload.title, description: payload.description }),
    onSuccess: () => {
      toast.success("Карточка добавлена");
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => toast.error("Не удалось создать карточку"),
  });


  const updateCardDetailsMutation = useMutation({
    mutationFn: ({ cardId, title, description }: { cardId: string; title?: string; description?: string }) =>
      updateCard(cardId, { title, description }),
    onSuccess: () => {
      toast.success("Карточка обновлена");
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => toast.error("Не удалось обновить карточку"),
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
    onSuccess: () => {
      toast.success("Карточка удалена");
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => deleteList(listId),
    onSuccess: () => {
      toast.success("Список удалён");
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  // Вынесенная мутация перемещения карточки — дочерний компонент отдаёт mutate через ref
  const moveCardMutateRef = useRef<((payload: { cardId: string; listId: string; position: number }) => void) | null>(null);

  // Стабильные обработчики (расположены до условного return)
  const handleAddCardOpen = useCallback((listId: string) => {
    setCardListId(listId);
  }, []);
  const handleDeleteListStable = useCallback((listId: string) => {
    deleteListMutation.mutate(listId);
  }, [deleteListMutation.mutate]);
  const handleRemoveCardStable = useCallback((cardId: string) => {
    deleteCardMutation.mutate(cardId);
  }, [deleteCardMutation.mutate]);

  const {
    register: registerList,
    handleSubmit: handleSubmitList,
    reset: resetList,
    formState: { errors: listErrors },
  } = useForm<ListSchema>({ resolver: zodResolver(listSchema) });

  const {
    register: registerCard,
    handleSubmit: handleSubmitCard,
    reset: resetCard,
    formState: { errors: cardErrors },
  } = useForm<CardSchema>({ resolver: zodResolver(cardSchema) });

  const {
    register: registerEditCard,
    handleSubmit: handleSubmitEditCard,
    reset: resetEditCard,
    formState: { errors: editCardErrors },
  } = useForm<CardSchema>({ resolver: zodResolver(cardSchema) });

  const handleCreateList = useCallback((data: ListSchema) => {
    createListMutation.mutate(
      { title: data.title },
      {
        onSuccess: () => resetList(),
      }
    );
  }, [createListMutation, resetList]);

  const handleCreateCard = useCallback((data: CardSchema) => {
    if (!cardListId) return;
    createCardMutation.mutate(
      { listId: cardListId, title: data.title, description: data.description },
      {
        onSuccess: () => {
          resetCard();
          setCardListId(null);
        },
      }
    );
  }, [cardListId, createCardMutation, resetCard]);

  // В @hello-pangea/dnd нет события dragStart

  const handleOpenEdit = useCallback((card: CardType) => {
    setEditingCard(card);
    resetEditCard({ title: card.title, description: card.description ?? undefined });
  }, [resetEditCard]);

  const handleEditCard = useCallback((data: CardSchema) => {
    if (!editingCard) return;
    updateCardDetailsMutation.mutate(
      { cardId: editingCard.id, title: data.title, description: data.description },
      {
        onSuccess: () => {
          setEditingCard(null);
        },
      }
    );
  }, [editingCard, updateCardDetailsMutation]);

  if (isLoading || !board) {
    return <div className="text-slate-400">Загружаем данные...</div>;
  }

  // Determine if the current user can manage all cards on this board
  const canManageAllCards = Boolean(
    user &&
      (user.role === "ADMIN" ||
        board?.owner?.id === user.id ||
        board?.members?.some((m) => m.user.id === user.id && (m.role === "OWNER" || m.role === "MANAGER")))
  );
  debugCount(`[BoardPage] render`);

  return (
    <div className="space-y-6">
      <MoveCardMutator boardId={boardId!} onReady={(mutate) => { moveCardMutateRef.current = mutate; }} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Командная доска</p>
          <h1 className="text-3xl font-semibold text-white">{board.title}</h1>
          {board.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-500">{board.description}</p>
          )}
        </div>
        {board.lists.length > 0 && (
          <Button variant="secondary" onClick={() => setCardListId(board.lists[0]?.id ?? null)} disabled={!board.lists.length}>
            <Plus className="h-4 w-4" /> Добавить карточку
          </Button>
        )}
      </header>

      <div className="flex gap-5 pb-4">
          {board.lists.map((list) => (
            <KanbanColumn
              key={list.id}
              list={list}
              onAddCard={handleAddCardOpen}
              onDeleteList={handleDeleteListStable}
              onRemoveCard={handleRemoveCardStable}
              canManageLists={canManageLists}
              currentUserId={user?.id}
              currentUserRole={user?.role}
              canManageAllCards={canManageAllCards}
              onEditCard={handleOpenEdit}
            />
          ))}

          {canManageLists && (
            <form
              className="min-w-[260px] space-y-3 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4"
              onSubmit={handleSubmitList(handleCreateList)}
            >
              <p className="text-sm font-medium text-white/80">Новый список</p>
              <Input placeholder="Например, 'В работе'" {...registerList("title")} />
              {listErrors.title && <p className="text-xs text-danger">{listErrors.title.message}</p>}
              <Button type="submit" size="sm" loading={createListMutation.isPending}>
                <Plus className="h-4 w-4" /> Добавить
              </Button>
            </form>
          )}
        </div>

      <Modal
        isOpen={cardListId !== null}
        onClose={() => setCardListId(null)}
        title="Новая карточка"
        description="Задайте название и при необходимости описание"
      >
        <form className="space-y-4" onSubmit={handleSubmitCard(handleCreateCard)}>
          <div>
            <label className="text-sm text-slate-300">Название</label>
            <Input placeholder="Что нужно сделать?" autoFocus {...registerCard("title")} />
            {cardErrors.title && <p className="text-xs text-danger">{cardErrors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm text-slate-300">Описание</label>
            <Textarea rows={4} placeholder="Какие детали важно учесть?" {...registerCard("description")} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setCardListId(null)}>
              Отмена
            </Button>
            <Button type="submit" loading={createCardMutation.isPending}>
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={editingCard !== null}
        onClose={() => setEditingCard(null)}
        title="Редактирование карточки"
        description="Измените поля карточки"
      >
        <form className="space-y-4" onSubmit={handleSubmitEditCard(handleEditCard)}>
          <div>
            <label className="text-sm text-slate-300">Название</label>
            <Input placeholder="Название задачи" autoFocus {...registerEditCard("title")} />
            {editCardErrors.title && <p className="text-xs text-danger">{editCardErrors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm text-slate-300">Описание</label>
            <Textarea rows={4} placeholder="Детали" {...registerEditCard("description")} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setEditingCard(null)}>
              Отмена
            </Button>
            <Button type="submit" loading={updateCardDetailsMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface KanbanColumnProps {
  list: List;
  onAddCard: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onRemoveCard: (cardId: string) => void;
  canManageLists: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  canManageAllCards: boolean;
  onEditCard: (card: CardType) => void;
}

const KanbanColumn = memo(function KanbanColumn({ list, onAddCard, onDeleteList, onRemoveCard, canManageLists, currentUserId, currentUserRole, canManageAllCards, onEditCard }: KanbanColumnProps) {
  const cardCount = list.cards.length;
  // Render/mount debug for KanbanColumn
  debugCount(`[KanbanColumn] render ${list.id} cards:${cardCount}`);
  useEffect(() => {
    debugLog('[KanbanColumn] mount', list.id);
    return () => debugLog('[KanbanColumn] unmount', list.id);
  }, []);

  return (
    <section className="flex min-w-[280px] max-w-[340px] flex-col gap-4 rounded-3xl border border-white/5 bg-white/5 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-white">{list.title}</h2>
          <p className="text-xs uppercase text-slate-500">Карточек: {cardCount}</p>
        </div>
        {canManageLists && (
          <button
            className="rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-danger"
            onClick={() => onDeleteList(list.id)}
            title="Удалить список"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="min-h-[50px] overflow-y-auto max-h-[80vh] relative">
        {list.cards.map((card, index) => (
          <KanbanCard
            key={card.id}
            card={card}
            listId={list.id}
            index={index}
            onRemove={onRemoveCard}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            canManageAllCards={canManageAllCards}
            onEdit={onEditCard}
          />
        ))}
        {!list.cards.length && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-center text-xs text-slate-500">
            Карточек пока нет
          </div>
        )}
      </div>

      <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => onAddCard(list.id)}>
        <Plus className="h-4 w-4" /> Добавить карточку
      </Button>
    </section>
  );
});

interface KanbanCardProps {
  card: CardType;
  listId?: string; // Сделаем необязательным, так как не используется
  index: number;
  onRemove: (cardId: string) => void;
  currentUserId?: string;
  currentUserRole?: string;
  canManageAllCards: boolean;
  onEdit: (card: CardType) => void;
}

 function areCardPropsEqual(prev: KanbanCardProps, next: KanbanCardProps) {
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

 const KanbanCard = memo(function KanbanCard({ card, /* listId, */ index, onRemove, currentUserId, currentUserRole, canManageAllCards, onEdit }: KanbanCardProps) {
  // Кэшируем вычисление canManageCard для избежания повторных вычислений
  const canManageCard = useMemo(() => 
    canManageAllCards || (currentUserRole !== "EMPLOYEE" && !!currentUserRole) || card.createdBy.id === currentUserId,
    [canManageAllCards, currentUserRole, card.createdBy.id, currentUserId]
  );

  // Кэшируем статус карточки для избежания повторных вычислений
  const cardStatus = useMemo(() => renderStatus(card), [card.status]);

  // Кэшируем дату для избежания повторных форматирований
  const formattedDate = useMemo(() => 
    card.dueDate ? format(new Date(card.dueDate), "d MMM", { locale: ru }) : null,
    [card.dueDate]
  );
  // Render/mount debug for KanbanCard
  debugCount(`[KanbanCard] render ${card.id}`);
  useEffect(() => {
    debugLog('[KanbanCard] mount', card.id);
    return () => debugLog('[KanbanCard] unmount', card.id);
  }, []);

  return (
    <div
      id={`card-${card.id}`}
      className="group select-none rounded-2xl border border-white/10 bg-surface/80 p-4 text-left shadow-lg transition hover:-translate-y-[1px] hover:border-primary/40"
      style={{
        marginBottom: 12,
        minHeight: 50,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{card.title}</p>
            </div>
            {canManageCard && (
              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  className="rounded-full p-1 text-slate-500 transition hover:bg-white/10"
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
                  className="rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-danger"
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
          {card.description && <p className="mt-2 line-clamp-3 text-xs text-slate-400">{card.description}</p>}
          <footer className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> {cardStatus}
            </span>
            {formattedDate && <span>{formattedDate}</span>}
          </footer>
        </div>
  );
 }, areCardPropsEqual);

// DragOverlayCard удален, так как в @hello-pangea/dnd нет компонента DragOverlay

function renderStatus(card: CardType) {
  switch (card.status) {
    case "IN_PROGRESS":
      return <Badge variant="outline">В работе</Badge>;
    case "REVIEW":
      return <Badge variant="outline">На проверке</Badge>;
    case "DONE":
      return <Badge variant="success">Готово</Badge>;
    default:
      return <Badge variant="outline">К выполнению</Badge>;
  }
}
