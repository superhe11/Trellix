import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragOverlay, PointerSensor, useSensors, useSensor } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Trash2, Pencil, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { getBoard } from "@/features/boards/api";
import { createList, deleteList } from "@/features/lists/api";
import { createCard, updateCard, deleteCard } from "@/features/cards/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card as UiCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import type { List, Card as CardType } from "@/types";

const listSchema = z.object({
  title: z.string().min(2, "Минимум 2 символа"),
});

type ListSchema = z.infer<typeof listSchema>;

const cardSchema = z.object({
  title: z.string().min(2, "Минимум 2 символа"),
  description: z.string().optional(),
});

type CardSchema = z.infer<typeof cardSchema>;

export function BoardPage() {
  const { boardId } = useParams();
  const queryClient = useQueryClient();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [cardListId, setCardListId] = useState<string | null>(null);

  const { data: board, isLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId!),
    enabled: Boolean(boardId),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    })
  );

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

  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, listId, position }: { cardId: string; listId: string; position: number }) =>
      updateCard(cardId, { listId, position }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
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

  const handleCreateList = (data: ListSchema) => {
    createListMutation.mutate(
      { title: data.title },
      {
        onSuccess: () => resetList(),
      }
    );
  };

  const handleCreateCard = (data: CardSchema) => {
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
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card as CardType | undefined;
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !board) {
      return;
    }

    const fromListId = active.data.current?.listId as string;
    const toListId = over.data.current?.listId as string;
    const overIndex = over.data.current?.index as number | undefined;

    if (!fromListId || !toListId) {
      return;
    }

    const targetList = board.lists.find((list) => list.id === toListId);
    const targetPosition = (overIndex ?? targetList?.cards.length ?? 0) + 1;

    updateCardMutation.mutate({
      cardId: active.id as string,
      listId: toListId,
      position: targetPosition,
    });
  };

  if (isLoading || !board) {
    return <div className="text-slate-400">Загружаем доску...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Доска</p>
          <h1 className="text-3xl font-semibold text-white">{board.title}</h1>
          {board.description && <p className="mt-2 max-w-2xl text-sm text-slate-500">{board.description}</p>}
        </div>
        <Button variant="secondary" onClick={() => setCardListId(board.lists[0]?.id ?? null)} disabled={!board.lists.length}>
          <Plus className="h-4 w-4" /> Быстрая карточка
        </Button>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {board.lists.map((list) => (
            <KanbanColumn
              key={list.id}
              list={list}
              onAddCard={() => setCardListId(list.id)}
              onDelete={() => deleteListMutation.mutate(list.id)}
              onRemoveCard={(cardId) => deleteCardMutation.mutate(cardId)}
            />
          ))}

          <form
            className="min-w-[260px] space-y-3 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4"
            onSubmit={handleSubmitList(handleCreateList)}
          >
            <p className="text-sm font-medium text-white/80">Новый список</p>
            <Input placeholder="Например, 'Сделать'" {...registerList("title")} />
            {listErrors.title && <p className="text-xs text-danger">{listErrors.title.message}</p>}
            <Button type="submit" size="sm" loading={createListMutation.isPending}>
              <Plus className="h-4 w-4" /> Добавить
            </Button>
          </form>
        </div>

        <DragOverlay>{activeCard && <DragOverlayCard card={activeCard} />}</DragOverlay>
      </DndContext>

      <Modal
        isOpen={cardListId !== null}
        onClose={() => setCardListId(null)}
        title="Новая карточка"
        description="Опишите задачу и распределите ответственность"
      >
        <form className="space-y-4" onSubmit={handleSubmitCard(handleCreateCard)}>
          <div>
            <label className="text-sm text-slate-300">Название</label>
            <Input placeholder="Бриф по новому лендингу" autoFocus {...registerCard("title")} />
            {cardErrors.title && <p className="text-xs text-danger">{cardErrors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm text-slate-300">Описание</label>
            <Textarea rows={4} placeholder="Что нужно сделать?" {...registerCard("description")} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setCardListId(null)}>
              Отмена
            </Button>
            <Button type="submit" loading={createCardMutation.isPending}>
              Добавить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface KanbanColumnProps {
  list: List;
  onAddCard: () => void;
  onDelete: () => void;
  onRemoveCard: (cardId: string) => void;
}

function KanbanColumn({ list, onAddCard, onDelete, onRemoveCard }: KanbanColumnProps) {
  return (
    <section className="flex min-w-[280px] max-w-[340px] flex-col gap-4 rounded-3xl border border-white/5 bg-white/5 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-white">{list.title}</h2>
          <p className="text-xs uppercase text-slate-500">{list.cards.length} задач</p>
        </div>
        <button
          className="rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-danger"
          onClick={onDelete}
          title="Удалить список"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      <SortableContext items={list.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {list.cards.map((card, index) => (
            <KanbanCard key={card.id} card={card} listId={list.id} index={index} onRemove={() => onRemoveCard(card.id)} />
          ))}
          {!list.cards.length && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-center text-xs text-slate-500">
              Карточек пока нет
            </div>
          )}
        </div>
      </SortableContext>

      <Button variant="ghost" size="sm" className="w-full justify-center" onClick={onAddCard}>
        <Plus className="h-4 w-4" /> Добавить карточку
      </Button>
    </section>
  );
}

interface KanbanCardProps {
  card: CardType;
  listId: string;
  index: number;
  onRemove: () => void;
}

function KanbanCard({ card, listId, index, onRemove }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { card, listId, index },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group cursor-grab select-none rounded-2xl border border-white/10 bg-surface/80 p-4 text-left shadow-lg transition hover:border-primary/40 ${
        isDragging ? "opacity-60" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{card.title}</p>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button className="rounded-full p-1 text-slate-500 transition hover:bg-white/10">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-danger"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {card.description && <p className="mt-2 line-clamp-3 text-xs text-slate-400">{card.description}</p>}
      <footer className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Tag className="h-3 w-3" /> {renderStatus(card)}
        </span>
        {card.dueDate && <span>{format(new Date(card.dueDate), "d MMM", { locale: ru })}</span>}
      </footer>
    </div>
  );
}

function DragOverlayCard({ card }: { card: CardType }) {
  return (
    <UiCard className="pointer-events-none w-72 rounded-2xl border border-primary/40 bg-surface/90 p-4 shadow-xl">
      <p className="text-sm font-semibold text-white">{card.title}</p>
      {card.description && <p className="mt-2 line-clamp-3 text-xs text-slate-400">{card.description}</p>}
    </UiCard>
  );
}

function renderStatus(card: CardType) {
  switch (card.status) {
    case "IN_PROGRESS":
      return <Badge variant="outline">В работе</Badge>;
    case "REVIEW":
      return <Badge variant="outline">Ревью</Badge>;
    case "DONE":
      return <Badge variant="success">Готово</Badge>;
    default:
      return <Badge variant="outline">В очереди</Badge>;
  }
}



