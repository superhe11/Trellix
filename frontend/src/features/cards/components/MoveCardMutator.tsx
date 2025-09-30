import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCard } from "@/features/cards/api";

type MovePayload = { cardId: string; listId: string; position: number };

export function MoveCardMutator({ boardId, onReady }: { boardId: string; onReady: (mutate: (payload: MovePayload) => void) => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ cardId, listId, position }: MovePayload) => updateCard(cardId, { listId, position }),
    onMutate: () => {
      console.count('[updateCard] onMutate');
    },
    onSuccess: () => {
      console.count('[updateCard] onSuccess');
    },
    onError: () => {
      console.count('[updateCard] onError');
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  useEffect(() => {
    onReady(mutation.mutate);
  }, [onReady, mutation.mutate]);

  return null;
}