import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Check, Edit2, X } from "lucide-react";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api-client";
import type { Board } from "@/types";
import { Button } from "@/components/ui/button";

type LeadWithBoards = { id: string; fullName: string; email: string; boards: { id: string; title: string; role: string }[] };

export function ProjectsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const res = await apiClient.get<{ leads: LeadWithBoards[]; boards: Pick<Board, "id" | "title">[] }>("/projects");
      return res.data;
    },
  });

  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [boardSearch, setBoardSearch] = useState("");

  const leads = data?.leads ?? [];
  const boards = data?.boards ?? [];

  const assignMutation = useMutation({
    mutationFn: async ({ leadId, boardIds }: { leadId: string; boardIds: string[] }) => {
      await apiClient.put(`/projects/leads/${leadId}/boards`, { boardIds });
    },
    onSuccess: () => {
      toast.success("Назначения обновлены");
      void queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: () => toast.error("Не удалось обновить назначения"),
  });

  const openEditor = (lead: LeadWithBoards) => {
    setEditingLeadId(lead.id);
    setSelectedBoards(new Set(lead.boards.map((b) => b.id)));
    setBoardSearch("");
  };

  const cancelEditor = () => {
    setEditingLeadId(null);
    setSelectedBoards(new Set());
    setBoardSearch("");
  };

  const toggleBoard = (boardId: string) => {
    setSelectedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  };

  const saveAssign = () => {
    if (!editingLeadId) return;
    assignMutation.mutate(
      { leadId: editingLeadId, boardIds: Array.from(selectedBoards) },
      { onSuccess: () => cancelEditor() }
    );
  };

  const filteredBoards = boards.filter((b) => b.title.toLowerCase().includes(boardSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Admin Panel</p>
          <h1 className="text-3xl font-semibold text-white">Проекты</h1>
          <p className="mt-2 text-sm text-slate-500">Назначайте доски руководителям; их подчинённые получат доступ автоматически.</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-white/5 bg-white/5">
        <h2 className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-white/90">
          <Briefcase className="h-4 w-4" /> Руководители и их доски
        </h2>
        <div className="divide-y divide-white/5">
          {isLoading && <div className="p-6 text-slate-500">Загрузка...</div>}
          {!isLoading && leads.length === 0 && <div className="p-6 text-slate-500">Руководителей нет</div>}
          {leads.map((lead) => {
            const isEditing = editingLeadId === lead.id;
            const boardsText = lead.boards.length ? lead.boards.map((b) => b.title).join(", ") : "—";
            return (
              <div key={lead.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{lead.fullName}</div>
                    <div className="text-xs text-slate-500">{lead.email}</div>
                    {!isEditing && (
                      <div className="mt-2 text-xs text-slate-300">
                        <span className="text-slate-500">Доски:</span> {boardsText}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {!isEditing ? (
                      <Button size="sm" onClick={() => openEditor(lead)}>
                        <Edit2 className="mr-1 h-4 w-4" /> Изменить
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelEditor}>
                          <X className="mr-1 h-4 w-4" /> Отмена
                        </Button>
                        <Button size="sm" onClick={saveAssign} loading={assignMutation.isPending}>
                          Сохранить
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-xs text-slate-400">Выберите доски</div>
                    <input
                      className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Поиск по названию..."
                      value={boardSearch}
                      onChange={(e) => setBoardSearch(e.target.value)}
                    />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredBoards.map((b) => {
                        const checked = selectedBoards.has(b.id);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                              checked ? "border-primary/50 bg-primary/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                            onClick={() => toggleBoard(b.id)}
                          >
                            <span className="truncate">{b.title}</span>
                            {checked && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ProjectsPage;


