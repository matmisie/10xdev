import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiSuggestionService } from "./aiSuggestionService";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

// --- Mocks ---

// Mockowanie uuid
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid"),
}));

// Mockowanie crypto-js
vi.mock("crypto-js/sha256", () => ({
  default: vi.fn(() => ({
    toString: () => "mock-hash",
  })),
}));

// Globalny mock dla fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSelect = vi.fn();
const mockInsert = vi.fn(() => ({
  select: mockSelect,
}));

const mockDb = {
  from: vi.fn(() => ({
    insert: mockInsert,
  })),
} as unknown as SupabaseClient<Database>;

// --- Test Suite ---

describe("AiSuggestionService", () => {
  let service: AiSuggestionService;

  beforeEach(() => {
    service = new AiSuggestionService();
    vi.clearAllMocks(); // Czyścimy mocki przed każdym testem
  });

  const text = "Jaki jest największy księżyc w Układzie Słonecznym?";
  const userId = "user-123";

  it("should generate and store suggestions successfully (happy path)", async () => {
    // Arrange
    const mockAiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              { front: "Największy księżyc Układu Słonecznego?", back: "Ganimedes" },
            ]),
          },
        },
      ],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAiResponse),
    });

    const mockDbInsertResponse = {
      data: [{ id: "suggestion-1" }],
      error: null,
    };
    // @ts-ignore
    mockSelect.mockResolvedValue(mockDbInsertResponse);

    // Act
    const result = await service.generateAndStoreSuggestions(text, userId, mockDb);

    // Assert
    // 1. Sprawdź wywołanie OpenRouter API
    expect(mockFetch).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", expect.any(Object));

    // 2. Sprawdź wywołanie insert do bazy danych
    expect(mockDb.from).toHaveBeenCalledWith("ai_suggestions");
    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "mock-uuid",
        user_id: userId,
        batch_id: "mock-uuid",
        source_text_hash: "mock-hash",
        front_suggestion: "Największy księżyc Układu Słonecznego?",
        back_suggestion: "Ganimedes",
        status: "pending",
      }),
    ]);
    expect(mockSelect).toHaveBeenCalled();

    // 3. Sprawdź wynik końcowy
    expect(result.data).toEqual(mockDbInsertResponse.data);
    expect(result.error).toBeNull();
  });

  it("should return an error if the AI service fetch fails", async () => {
    // Arrange
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    // Act
    const result = await service.generateAndStoreSuggestions(text, userId, mockDb);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe("Failed to fetch suggestions from AI service.");
    expect(mockDb.from).not.toHaveBeenCalled(); // Baza danych nie powinna być wywołana
  });

  it("should return an error if the database insert fails", async () => {
    // Arrange
    const mockAiResponse = {
      choices: [{ message: { content: JSON.stringify([{ front: "Q", back: "A" }]) } }],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAiResponse),
    });

    const dbError = { message: "DB constraint violation" };
    // @ts-ignore
    mockSelect.mockResolvedValue({ data: null, error: dbError });

    // Act
    const result = await service.generateAndStoreSuggestions(text, userId, mockDb);

    // Assert
    expect(mockFetch).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(result.data).toBeNull();
    expect(result.error).toBe("Failed to save suggestions.");
  });

  it("should handle invalid JSON from the AI service", async () => {
    // Arrange
    const mockAiResponse = {
      choices: [{ message: { content: "this is not json" } }],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAiResponse),
    });

    // Act
    const result = await service.generateAndStoreSuggestions(text, userId, mockDb);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe("An unexpected error occurred.");
    expect(mockDb.from).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors during the process", async () => {
    // Arrange
    mockFetch.mockRejectedValue(new Error("Network Failure"));

    // Act
    const result = await service.generateAndStoreSuggestions(text, userId, mockDb);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe("An unexpected error occurred.");
  });
}); 