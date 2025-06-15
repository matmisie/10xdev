import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAiSuggestionsStore } from "./useAiSuggestionsStore";
import type { AiSuggestionDto, GenerateAiSuggestionsCommand } from "@/types";

vi.mock("astro:transitions/client", () => ({
  navigate: vi.fn(),
}));
import { navigate } from "astro:transitions/client";

// Mockowanie globalnego obiektu fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mockowanie globalnego obiektu window.location
beforeAll(() => {
  const location = {
    ...window.location,
    href: "",
  };
  vi.spyOn(window, "location", "get").mockImplementation(() => location);
});

const mockSuccessResponse = (suggestions: AiSuggestionDto[]) => ({
  ok: true,
  json: () => Promise.resolve(suggestions),
});

const mockErrorResponse = (status: number, statusText: string, body = "") => ({
  ok: false,
  status,
  statusText,
  text: () => Promise.resolve(body),
});

describe("useAiSuggestionsStore - generateSuggestions", () => {
  beforeEach(() => {
    // Resetowanie stanu store'u i mocków przed każdym testem
    useAiSuggestionsStore.getState().clearSuggestions();
    vi.clearAllMocks();
  });

  it("should set loading state to true and reset error when starting generation", async () => {
    const command: GenerateAiSuggestionsCommand = { text: "Przykładowy tekst do generowania fiszek." };
    useAiSuggestionsStore.setState({ error: "Poprzedni błąd" });

    // Rozpoczynamy wywołanie, ale nie czekamy na jego zakończenie
    const promise = useAiSuggestionsStore.getState().generateSuggestions(command);

    // Sprawdzamy stan natychmiast po wywołaniu
    expect(useAiSuggestionsStore.getState().isLoading).toBe(true);
    expect(useAiSuggestionsStore.getState().error).toBe(null);

    // Czekamy na zakończenie, aby uniknąć niezakończonych operacji
    mockFetch.mockResolvedValue(mockSuccessResponse([]));
    await promise;
  });

  it("should handle successful suggestion generation and redirect", async () => {
    const command: GenerateAiSuggestionsCommand = { text: "To jest tekst, który na pewno zadziała." };
    const mockSuggestions: AiSuggestionDto[] = [
      {
        id: "1",
        front_suggestion: "Pytanie 1",
        back_suggestion: "Odpowiedź 1",
        status: "pending",
        user_id: "user-123",
        batch_id: "batch-abc",
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        front_suggestion: "Pytanie 2",
        back_suggestion: "Odpowiedź 2",
        status: "pending",
        user_id: "user-123",
        batch_id: "batch-abc",
        created_at: new Date().toISOString(),
      },
    ];

    mockFetch.mockResolvedValue(mockSuccessResponse(mockSuggestions));

    await useAiSuggestionsStore.getState().generateSuggestions(command);

    // Weryfikacja wywołania fetch
    expect(mockFetch).toHaveBeenCalledWith("/api/ai-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: command.text }),
    });

    // Weryfikacja stanu store'u
    const state = useAiSuggestionsStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.suggestions).toEqual(mockSuggestions);
    expect(state.error).toBe(null);

    // Weryfikacja przekierowania
    expect(navigate).toHaveBeenCalledWith("/app/review-suggestions");
  });

  it("should handle API errors gracefully", async () => {
    const command: GenerateAiSuggestionsCommand = { text: "Tekst, który spowoduje błąd API." };

    mockFetch.mockResolvedValue(mockErrorResponse(500, "Internal Server Error", "Internal error"));

    await useAiSuggestionsStore.getState().generateSuggestions(command);

    // Weryfikacja stanu store'u
    const state = useAiSuggestionsStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.suggestions).toEqual([]);
    expect(state.error).toContain("Błąd serwera: 500");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("should handle network errors gracefully", async () => {
    const command: GenerateAiSuggestionsCommand = { text: "Tekst, który spowoduje błąd sieciowy." };
    const networkErrorMessage = "Network request failed";

    mockFetch.mockRejectedValue(new Error(networkErrorMessage));

    await useAiSuggestionsStore.getState().generateSuggestions(command);

    // Weryfikacja stanu store'u
    const state = useAiSuggestionsStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.suggestions).toEqual([]);
    expect(state.error).toBe(networkErrorMessage);
  });

  it("should ensure isLoading is set to false after a successful request", async () => {
    const command: GenerateAiSuggestionsCommand = { text: "Upewnij się, że ładowanie jest wyłączone po sukcesie." };
    mockFetch.mockResolvedValue(mockSuccessResponse([]));

    await useAiSuggestionsStore.getState().generateSuggestions(command);

    expect(useAiSuggestionsStore.getState().isLoading).toBe(false);
  });

  it("should ensure isLoading is set to false after a failed request", async () => {
    const command: GenerateAiSuggestionsCommand = { text: "Upewnij się, że ładowanie jest wyłączone po błędzie." };
    mockFetch.mockRejectedValue(new Error("Błąd"));

    await useAiSuggestionsStore.getState().generateSuggestions(command);

    expect(useAiSuggestionsStore.getState().isLoading).toBe(false);
  });
});
