﻿﻿﻿import { useEffect, useState, useCallback, memo, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Trash2, Pencil, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";

import { useAuthStore } from "@/store/auth-store";
import { getBoard } from "@/features/boards/api";
import { createList, deleteList } from "@/features/lists/api";
import { createCard, updateCard, deleteCard, attachTag, detachTag, toggleFavoriteTag, reorderTags } from "@/features/cards/api";
import { getBoardTags, createBoardTag } from "@/features/tags/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DroppableList } from "@/components/dnd/DroppableList";
import { DragOverlay as CustomDragOverlay } from "@/components/dnd/DragOverlay";
import { MoveCardMutator } from "@/features/cards/components/MoveCardMutator";
import type { List, Card as CardType } from "@/types";

// Debug utilities
const debugCount = (msg: string) => console.count(msg);
const debugLog = (msg: string, ...args: any[]) => console.log(msg, ...args);

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
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const { data: boardTags } = useQuery({
    queryKey: ["board-tags", boardId],
    queryFn: () => getBoardTags(boardId!),
    enabled: Boolean(boardId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: board, isLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoard(boardId!),
    enabled: Boolean(boardId),
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
  });

  // Настройка сенсоров для drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Минимальное расстояние для активации перетаскивания
      },
    })
  );

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

  const attachTagMutation = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: string; tagId: string }) => attachTag(cardId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => toast.error("Не удалось добавить тег"),
  });

  const detachTagMutation = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: string; tagId: string }) => detachTag(cardId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => toast.error("Не удалось удалить тег"),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ cardId, tagId, isFavorite }: { cardId: string; tagId: string; isFavorite: boolean }) =>
      toggleFavoriteTag(cardId, tagId, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => toast.error("Не удалось обновить избранный тег"),
  });

  const reorderTagsMutation = useMutation({
    mutationFn: ({ tagIds }: { tagIds: string[] }) => reorderTags(editingCard!.id, tagIds),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      setEditingCard(updated);
    },
    onError: () => toast.error("Не удалось изменить порядок тегов"),
  });

  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createBoardTag(boardId!, { name, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-tags", boardId] });
    },
    onError: () => toast.error("Не удалось создать тег"),
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

  // Локальное состояние порядка тегов в модальном окне
  const [tagOrder, setTagOrder] = useState<string[]>([]);
  useEffect(() => {
    if (editingCard?.tags) {
      const order = [...editingCard.tags].sort((a, b) => a.position - b.position).map((ct) => ct.tag.id);
      setTagOrder(order);
    } else {
      setTagOrder([]);
    }
  }, [editingCard?.id]);

  // Обработчики drag and drop
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const cardId = active.id as string;
    
    // Находим карточку по ID
    const card = board?.lists
      .flatMap(list => list.cards)
      .find(card => card.id === cardId);
    
    if (card) {
      setActiveCard(card);
    }
  }, [board]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Если перетаскиваем над той же карточкой, ничего не делаем
    if (activeId === overId) return;
    
    // Находим активную карточку и список, над которым находимся
    const activeCard = board?.lists
      .flatMap(list => list.cards)
      .find(card => card.id === activeId);
    
    if (!activeCard) return;
    
    const activeList = board?.lists.find(list => 
      list.cards.some(card => card.id === activeId)
    );
    
    const overList = board?.lists.find(list => 
      list.id === overId || list.cards.some(card => card.id === overId)
    );
    
    if (!activeList || !overList) return;
    
    // Если перемещаем между разными списками
    if (activeList.id !== overList.id) {
      // Оптимистичное обновление UI
      queryClient.setQueryData(["board", boardId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const newLists = oldData.lists.map((list: List) => {
          if (list.id === activeList.id) {
            return {
              ...list,
              cards: list.cards.filter(card => card.id !== activeId)
            };
          }
          if (list.id === overList.id) {
            // Проверяем, что карточки еще нет в целевом списке
            const cardExists = list.cards.some(card => card.id === activeId);
            if (cardExists) return list;
            
            const overCardIndex = list.cards.findIndex(card => card.id === overId);
            const newCards = [...list.cards];
            
            if (overCardIndex >= 0) {
              newCards.splice(overCardIndex, 0, activeCard);
            } else {
              newCards.push(activeCard);
            }
            
            return {
              ...list,
              cards: newCards
            };
          }
          return list;
        });
        
        return { ...oldData, lists: newLists };
      });
    }
  }, [board, boardId, queryClient]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveCard(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;
    
    // Находим активную карточку и целевой список
    const activeCard = board?.lists
      .flatMap(list => list.cards)
      .find(card => card.id === activeId);
    
    if (!activeCard) return;
    
    const activeList = board?.lists.find(list => 
      list.cards.some(card => card.id === activeId)
    );
    
    let targetList = board?.lists.find(list => list.id === overId);
    let targetPosition = 0;
    
    if (!targetList) {
      // Если over - это карточка, находим её список
      targetList = board?.lists.find(list => 
        list.cards.some(card => card.id === overId)
      );
      
      if (targetList) {
        const overCardIndex = targetList.cards.findIndex(card => card.id === overId);
        targetPosition = overCardIndex >= 0 ? overCardIndex : targetList.cards.length;
      }
    }
    
    if (!activeList || !targetList) return;
    
    // Если перемещаем в том же списке
    if (activeList.id === targetList.id) {
      const oldIndex = activeList.cards.findIndex(card => card.id === activeId);
      const newIndex = targetList.cards.findIndex(card => card.id === overId);
      
      if (oldIndex !== newIndex && newIndex >= 0) {
        // Оптимистичное обновление для сортировки в том же списке
        queryClient.setQueryData(["board", boardId], (oldData: any) => {
          if (!oldData) return oldData;
          
          const newLists = oldData.lists.map((list: List) => {
            if (list.id === activeList.id) {
              const newCards = arrayMove(list.cards, oldIndex, newIndex);
              return { ...list, cards: newCards };
            }
            return list;
          });
          
          return { ...oldData, lists: newLists };
        });
        
        // Вызываем API для обновления позиции
        if (moveCardMutateRef.current) {
          moveCardMutateRef.current({
            cardId: activeId,
            listId: targetList.id,
            position: newIndex
          });
        }
      }
    } else {
      // Перемещение между списками уже обработано в handleDragOver
      // Вызываем API для сохранения изменений
      if (moveCardMutateRef.current) {
        moveCardMutateRef.current({
          cardId: activeId,
          listId: targetList.id,
          position: targetPosition
        });
      }
    }
  }, [board, boardId, queryClient, moveCardMutateRef]);

  const handleOpenEdit = useCallback((card: CardType) => {
    setEditingCard(card);
    setIsEditMode(false);
    resetEditCard({ title: card.title, description: card.description ?? undefined });
  }, [resetEditCard]);

  const handleToggleFavoriteTag = useCallback((cardId: string, tagId: string, isFavorite: boolean) => {
    toggleFavoriteMutation.mutate({ cardId, tagId, isFavorite });
  }, [toggleFavoriteMutation.mutate]);

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 pb-4">
          {board.lists.map((list) => (
            <DroppableList
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
              onToggleFavoriteTag={handleToggleFavoriteTag}
            />
          ))}

          {canManageLists && (
            <form
              className="min-w-[260px] space-y-3 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4"
              onSubmit={handleSubmitList(handleCreateList)}
            >
              <p className="text-sm font-medium text-white/80">Новый список</p>
              <Input placeholder="Например, 'В работе'" {...registerList("title")} />
              {listErrors.title && <p className="text-xs text-red-400">{listErrors.title.message}</p>}
              <Button type="submit" size="sm" loading={createListMutation.isPending}>
                <Plus className="h-4 w-4" /> Добавить
              </Button>
            </form>
          )}
        </div>

        <DragOverlay>
          <CustomDragOverlay activeCard={activeCard} />
        </DragOverlay>
      </DndContext>

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
        title={isEditMode ? "Редактирование карточки" : "Просмотр карточки"}
        description={isEditMode ? "Измените поля карточки и теги" : "Название, описание и теги"}
      >
        <form className="space-y-4" onSubmit={isEditMode ? handleSubmitEditCard(handleEditCard) : (e) => e.preventDefault()}>
          {editingCard && (
            <div className="space-y-4">
              {/* Название */}
              <div>
                <label className="text-sm text-slate-300">Название</label>
                {isEditMode ? (
                  <>
                    <Input placeholder="Название задачи" autoFocus {...registerEditCard("title")} />
                    {editCardErrors.title && <p className="text-xs text-danger">{editCardErrors.title.message}</p>}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-white">{editingCard.title}</p>
                )}
              </div>
              {/* Описание */}
              <div>
                <label className="text-sm text-slate-300">Описание</label>
                {isEditMode ? (
                  <>
                    <Textarea rows={4} placeholder="Детали" {...registerEditCard("description")} />
                    {editCardErrors.description && <p className="text-xs text-danger">{editCardErrors.description.message}</p>}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-300">{editingCard.description ?? "—"}</p>
                )}
              </div>

              {/* Доступные теги доски для добавления/убирания к карточке */}
              <div className="space-y-3">
                <label className="text-sm text-slate-300">Теги</label>
                <div className="flex flex-wrap gap-2">
                  {boardTags?.map((t) => {
                    const selected = editingCard.tags?.some((ct) => ct.tag.id === t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`px-2 py-1 rounded-md border text-xs ${selected ? 'border-blue-400/40 text-blue-300' : 'border-white/10 text-slate-400'} hover:border-white/30`}
                        style={{ borderColor: t.color, color: t.color }}
                        onClick={() => {
                          if (selected) {
                            detachTagMutation.mutate({ cardId: editingCard.id, tagId: t.id });
                          } else {
                            attachTagMutation.mutate({ cardId: editingCard.id, tagId: t.id });
                          }
                        }}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>

                {/* Управление тегами карточки: drag-n-drop порядок, крестик для удаления, сердечко для избранного */}
                <div className="space-y-2">
                  <p className="text-xs uppercase text-slate-500 tracking-wider">Теги этой карточки (перетаскивайте для изменения порядка)</p>
                  <DndContext
                    onDragEnd={(e) => {
                      const { active, over } = e;
                      if (!active || !over) return;
                      const activeId = String(active.id);
                      const overId = String(over.id);
                      if (activeId === overId) return;
                      const oldIndex = tagOrder.indexOf(activeId);
                      const newIndex = tagOrder.indexOf(overId);
                      if (oldIndex === -1 || newIndex === -1) return;
                      const next = arrayMove(tagOrder, oldIndex, newIndex);
                      setTagOrder(next);
                      reorderTagsMutation.mutate({ tagIds: next });
                    }}
                  >
                    <SortableContext items={tagOrder} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-wrap gap-2">
                        {(editingCard.tags ?? [])
                          .slice()
                          .sort((a, b) => a.position - b.position)
                          .map((ct) => (
                            <TagChip
                              key={ct.tag.id}
                              ct={ct}
                              onDetach={(id) => {
                                detachTagMutation.mutate({ cardId: editingCard.id, tagId: id }, {
                                  onSuccess: (updated) => {
                                    setEditingCard(updated);
                                    setTagOrder((updated.tags ?? []).map((t) => t.tag.id));
                                  }
                                });
                              }}
                              onToggleFavorite={(id, makeFav) => {
                                toggleFavoriteMutation.mutate({ cardId: editingCard.id, tagId: id, isFavorite: makeFav }, {
                                  onSuccess: (updated) => {
                                    setEditingCard(updated);
                                    setTagOrder((updated.tags ?? []).map((t) => t.tag.id));
                                  }
                                });
                              }}
                            />
                          ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                {/* Создание нового тега (опционально) */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Название нового тега"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const name = (e.target as HTMLInputElement).value.trim();
                        if (!name) return;
                        const color = '#8884d8';
                        createTagMutation.mutate({ name, color });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const input = document.querySelector<HTMLInputElement>('input[placeholder="Название нового тега"]');
                      const name = input?.value.trim();
                      if (!name) return;
                      const color = '#8884d8';
                      createTagMutation.mutate({ name, color });
                      if (input) input.value = '';
                    }}
                  >
                    Добавить тег
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setEditingCard(null)}>
              Закрыть
            </Button>
            {isEditMode ? (
              <Button type="submit" loading={updateCardDetailsMutation.isPending}>
                Сохранить
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => {
                setIsEditMode(true);
                if (editingCard) {
                  resetEditCard({ title: editingCard.title, description: editingCard.description ?? undefined });
                }
              }}>
                Редактировать
              </Button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TagChip({ ct, onDetach, onToggleFavorite }: {
  ct: CardType["tags"][number];
  onDetach: (tagId: string) => void;
  onToggleFavorite: (tagId: string, isFavorite: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ct.tag.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: ct.tag.color, color: ct.tag.color }}
      {...attributes}
      {...listeners}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
    >
      <span>{ct.tag.name}</span>
      <button
        className={`ml-1 rounded-full p-0.5 ${ct.isFavorite ? "text-red-400" : "text-slate-500"}`}
        title={ct.isFavorite ? "Снять избранное" : "Сделать избранным"}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(ct.tag.id, !ct.isFavorite); }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.716-4.284-9.102-6.67C1.068 12.5 1 9.5 3.102 7.398a5.5 5.5 0 017.778 0L12 8.52l1.12-1.121a5.5 5.5 0 017.778 0C22.999 9.5 22.932 12.5 21.102 14.33 18.716 16.716 12 21 12 21z"/></svg>
      </button>
      <button
        className="rounded-full p-0.5 text-slate-500 hover:text-red-400"
        title="Убрать тег из карточки"
        onClick={(e) => { e.stopPropagation(); onDetach(ct.tag.id); }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7a1 1 0 10-1.41 1.41L10.59 12l-4.9 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.9a1 1 0 001.41-1.41L13.41 12l4.9-4.89a1 1 0 000-1.41z"/></svg>
      </button>
    </div>
  );
}
