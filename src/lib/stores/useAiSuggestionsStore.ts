import { create } from "zustand";
import type { AiSuggestionDto, GenerateAiSuggestionsCommand } from "@/types";
import { navigate } from "astro:transitions/client";

interface AiSuggestionsState {
  suggestions: AiSuggestionDto[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: (command: GenerateAiSuggestionsCommand) => Promise<void>;
  acceptSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;
  clearSuggestions: () => void;
  removeSuggestion: (id: string) => void;
}

export const useAiSuggestionsStore = create<AiSuggestionsState>((set, get) => ({
  suggestions: [],
  isLoading: false,
  error: null,
  generateSuggestions: async ({ text }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        await response.text();
        throw new Error(`Błąd serwera: ${response.status}.`);
      }

      const suggestions: AiSuggestionDto[] = await response.json();

      // Krok 1: Ustaw stan z nowymi sugestiami
      set({ suggestions, isLoading: false });

      // Krok 2: Przekieruj na stronę weryfikacji
      await navigate("/app/review-suggestions");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
      set({ error: errorMessage, isLoading: false });
    }
  },

  acceptSuggestion: async (id: string) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/ai-suggestions/${id}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
      }
      get().removeSuggestion(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
      set({ error: errorMessage });
      throw error;
    }
  },

  rejectSuggestion: async (id: string) => {
    try {
      const response = await fetch(`/api/ai-suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się odrzucić sugestii.");
      }
      get().removeSuggestion(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
      set({ error: errorMessage });
      // TODO: Lepsza obsługa błędów, np. toast
    }
  },

  removeSuggestion: (id: string) => {
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.id !== id),
    }));
  },

  clearSuggestions: () => {
    set({ suggestions: [], error: null });
  },
}));
