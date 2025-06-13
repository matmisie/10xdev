import { create } from "zustand";
import type { AiSuggestionDto, GenerateAiSuggestionsCommand, UpdateAiSuggestionCommand } from "@/types";

interface AiSuggestionsState {
  suggestions: AiSuggestionDto[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: (text: string) => Promise<void>;
  acceptSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;
  clearSuggestions: () => void;
}

export const useAiSuggestionsStore = create<AiSuggestionsState>((set, get) => ({
  suggestions: [],
  isLoading: false,
  error: null,
  generateSuggestions: async (text: string) => {
    set({ isLoading: true, error: null });
    try {
      const command: GenerateAiSuggestionsCommand = { text };
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error("Nie udało się wygenerować sugestii.");
      }

      const suggestions: AiSuggestionDto[] = await response.json();
      set({ suggestions });
      window.location.href = "/app/review-suggestions";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },
  acceptSuggestion: async (id: string) => {
    try {
      const response = await fetch(`/api/ai-suggestions/${id}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Nie udało się zaakceptować sugestii.");
      }

      set((state) => ({
        suggestions: state.suggestions.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error("Błąd podczas akceptacji:", error);
      // Optionally, set an error state to be displayed in the UI
    }
  },
  rejectSuggestion: async (id: string) => {
    try {
      const command: UpdateAiSuggestionCommand = { status: "rejected" };
      const response = await fetch(`/api/ai-suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error("Nie udało się odrzucić sugestii.");
      }

      set((state) => ({
        suggestions: state.suggestions.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error("Błąd podczas odrzucania:", error);
    }
  },
  clearSuggestions: () => {
    set({ suggestions: [], isLoading: false, error: null });
  },
}));
