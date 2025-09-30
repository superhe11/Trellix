import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBoards, createBoard } from "@/features/boards/api";
import type { CreateBoardPayload } from "@/features/boards/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import type { Board } from "@/types";
import { Link } from "react-router-dom";
import { PlusCircle, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createBoardSchema = z.object({
  title: z.string().min(3, "Минимальная длина — 3 символа"),
  description: z.string().max(280, "Максимум 280 символов").optional(),
});

type CreateBoardSchema = z.infer<typeof createBoardSchema>;

export function BoardsPage() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  const { data: boards, isLoading: isBoardsPending } = useQuery({
    queryKey: ["boards", userId],
    queryFn: getBoards,
    enabled: Boolean(userId),
  });
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBoardSchema>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const canCreateBoard = user?.role === "ADMIN" || user?.role === "LEAD";

  const { mutateAsync: createBoardMutation, isPending } = useMutation({
    mutationFn: (payload: CreateBoardPayload) => createBoard(payload),
    onSuccess: (board) => {
      toast.success(`Доска «${board.title}» создана`);
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["boards", userId] });
      }
      reset();
      setModalOpen(false);
    },
    onError: () => {
      toast.error("Не удалось создать доску");
    },
  });

  const onSubmit = async (data: CreateBoardSchema) => {
    await createBoardMutation({ title: data.title, description: data.description });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Командные доски</p>
          <h1 className="text-3xl font-semibold text-white">Рабочие пространства</h1>
          <p className="mt-2 text-sm text-slate-500">Планируйте проекты, распределяйте задачи и отслеживайте прогресс команды.</p>
        </div>
        {canCreateBoard && (
          <Button size="lg" onClick={() => setModalOpen(true)}>
            <PlusCircle className="h-5 w-5" />
            Новая доска
          </Button>
        )}
      </header>

      {isBoardsPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-40 animate-pulse bg-white/5">
              <div className="h-full w-full rounded-3xl bg-white/10" />
            </Card>
          ))}
        </div>
      ) : boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <BoardTile key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <EmptyBoardsState onCreate={() => setModalOpen(true)} canCreate={canCreateBoard} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Создание новой доски"
        description="Заполните поля, чтобы открыть доступ команде"
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm text-slate-300">Название</label>
            <Input autoFocus placeholder="Например, «Запуск платформы»" {...register("title")} />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm text-slate-300">Описание</label>
            <Textarea rows={4} placeholder="Расскажите, для чего нужна доска" {...register("description")} />
            {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" loading={isPending}>
              Создать
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function BoardTile({ board }: { board: Board }) {
  const memberCount = typeof board.accessCount === "number" ? board.accessCount : board.members.length;
  const listCount = board.lists.length;

  return (
    <Link to={`/boards/${board.id}`}>
      <Card className="flex h-44 flex-col justify-between rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 via-white/0 to-white/10 p-6 transition-transform hover:-translate-y-1 hover:border-primary/40 hover:shadow-floating">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Доска</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{board.title}</h3>
          {board.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{board.description}</p>}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Списков: {listCount}</span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" /> {memberCount}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function EmptyBoardsState({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 py-16 text-center">
      <h3 className="text-xl font-semibold text-white">Пока ещё нет ни одной доски</h3>
      <p className="max-w-md text-sm text-slate-400">
        Создайте первую доску, чтобы структурировать задачи и делиться прогрессом с командой.
      </p>
      {canCreate && (
        <Button onClick={onCreate}>
          <PlusCircle className="h-5 w-5" /> Создать доску
        </Button>
      )}
    </Card>
  );
}
