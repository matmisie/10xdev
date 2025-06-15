import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import useStudySession from "./useStudySession";
import type { FlashcardDto } from "@/types";

const mockFlashcards: FlashcardDto[] = [
  {
    id: "1",
    front: "Q1",
    back: "A1",
    leitner_box: 1,
    user_id: "user-1",
    next_review_at: "",
    created_at: "",
    updated_at: "",
    source: "manual",
  },
  {
    id: "2",
    front: "Q2",
    back: "A2",
    leitner_box: 2,
    user_id: "user-1",
    next_review_at: "",
    created_at: "",
    updated_at: "",
    source: "manual",
  },
];

const mockEmptyFlashcards: FlashcardDto[] = [];

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast to prevent errors during tests
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useStudySession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should start with a loading status and then transition to studying", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFlashcards,
    });

    const { result } = renderHook(() => useStudySession());

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("studying");
    });

    expect(result.current.cards).toEqual(mockFlashcards);
    expect(result.current.currentCard?.id).toBe("1");
  });

  it("should transition to empty status if no cards are fetched", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyFlashcards,
    });

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
    expect(result.current.cards).toEqual([]);
  });

  it("should handle fetch error gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => {
      expect(result.current.status).toBe("loading");
    });
    expect(result.current.status).not.toBe("studying");
    expect(result.current.status).not.toBe("empty");
  });

  it("should show the answer when showAnswer is called", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFlashcards,
    });

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => {
      expect(result.current.status).toBe("studying");
    });

    expect(result.current.isAnswerVisible).toBe(false);

    act(() => {
      result.current.showAnswer();
    });

    expect(result.current.isAnswerVisible).toBe(true);
  });

  describe("gradeAnswer", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it("should increment correct answers and move to the next card on 'correct'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlashcards,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => expect(result.current.status).toBe("studying"));

      await act(async () => {
        await result.current.gradeAnswer("correct");
      });

      expect(result.current.correctAnswersCount).toBe(1);
      expect(result.current.currentCardIndex).toBe(1);
      expect(result.current.isAnswerVisible).toBe(false);
    });

    it("should not increment correct answers but move to the next card on 'incorrect'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlashcards,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => expect(result.current.status).toBe("studying"));

      await act(async () => {
        await result.current.gradeAnswer("incorrect");
      });

      expect(result.current.correctAnswersCount).toBe(0);
      expect(result.current.currentCardIndex).toBe(1);
    });

    it("should transition to summary status after grading the last card", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockFlashcards[0]], // Session with only one card
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => expect(result.current.status).toBe("studying"));

      await act(async () => {
        await result.current.gradeAnswer("correct");
      });

      expect(result.current.status).toBe("summary");
      expect(result.current.reviewedCount).toBe(1);
      expect(result.current.correctAnswersCount).toBe(1);
    });
  });
});
