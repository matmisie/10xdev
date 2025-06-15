import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { StudyService, calculateNextReviewDate } from "./study.service";
import type { FlashcardDto } from "../../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

// Mock SupabaseClient
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  lte: vi.fn(),
  update: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

// Casting to any to satisfy the complex SupabaseClient type
const supabase = mockSupabaseClient as unknown as SupabaseClient<Database>;

describe("StudyService", () => {
  let studyService: StudyService;

  beforeEach(() => {
    vi.clearAllMocks();
    studyService = new StudyService(supabase);
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getReviewDeck", () => {
    it("should return an array of flashcards due for review", async () => {
      const mockFlashcards: FlashcardDto[] = [
        {
          id: "1",
          front: "Q1",
          back: "A1",
          leitner_box: 1,
          user_id: "user-1",
          next_review_at: new Date().toISOString(),
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
          next_review_at: new Date().toISOString(),
          created_at: "",
          updated_at: "",
          source: "manual",
        },
      ];
      // Mock the final method in the chain
      mockSupabaseClient.lte.mockResolvedValueOnce({ data: mockFlashcards, error: null });

      const deck = await studyService.getReviewDeck("user-1");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("*");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith("next_review_at", expect.any(String));
      expect(deck).toEqual(mockFlashcards);
      expect(deck.length).toBe(2);
    });

    it("should return an empty array if no flashcards are due", async () => {
      mockSupabaseClient.lte.mockResolvedValueOnce({ data: [], error: null });

      const deck = await studyService.getReviewDeck("user-1");
      expect(deck).toEqual([]);
      expect(deck.length).toBe(0);
    });

    it("should throw an error if supabase fetch fails", async () => {
      const error = new Error("DB Fetch failed");
      mockSupabaseClient.lte.mockResolvedValueOnce({ data: null, error });

      await expect(studyService.getReviewDeck("user-1")).rejects.toThrow("Could not fetch flashcards for review.");
    });
  });

  describe("gradeFlashcard", () => {
    it("should correctly upgrade a flashcard and set next review date on 'correct' outcome", async () => {
      const flashcardId = "flashcard-1";
      const userId = "user-1";
      const currentFlashcard = { id: flashcardId, leitner_box: 2 };
      const updatedFlashcardData = {
        leitner_box: 3,
        next_review_at: calculateNextReviewDate(3),
      };

      // 1. Mock fetch for the current flashcard
      mockSupabaseClient.single.mockResolvedValueOnce({ data: currentFlashcard, error: null });
      // 2. Mock the update operation result
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...currentFlashcard, ...updatedFlashcardData },
        error: null,
      });

      const result = await studyService.gradeFlashcard(flashcardId, userId, "correct");

      // Verify fetch call
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("id, leitner_box");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", flashcardId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", userId);

      // Verify update call
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updatedFlashcardData);
      expect(result.leitner_box).toBe(3);
      expect(result.next_review_at).toBe(updatedFlashcardData.next_review_at);
    });

    it("should reset a flashcard to box 1 on 'incorrect' outcome", async () => {
      const flashcardId = "flashcard-1";
      const userId = "user-1";
      const currentFlashcard = { id: flashcardId, leitner_box: 4 };
      const updatedFlashcardData = {
        leitner_box: 1,
        next_review_at: calculateNextReviewDate(1),
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: currentFlashcard, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...currentFlashcard, ...updatedFlashcardData },
        error: null,
      });

      const result = await studyService.gradeFlashcard(flashcardId, userId, "incorrect");

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updatedFlashcardData);
      expect(result.leitner_box).toBe(1);
    });

    it("should not advance past the highest Leitner box (5)", async () => {
      const flashcardId = "flashcard-1";
      const userId = "user-1";
      const currentFlashcard = { id: flashcardId, leitner_box: 5 };
      const updatedFlashcardData = {
        leitner_box: 5,
        next_review_at: calculateNextReviewDate(5),
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: currentFlashcard, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...currentFlashcard, ...updatedFlashcardData },
        error: null,
      });

      const result = await studyService.gradeFlashcard(flashcardId, userId, "correct");
      expect(result.leitner_box).toBe(5);
    });

    it("should throw an error if the flashcard to grade is not found", async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: new Error("Not Found") });

      await expect(studyService.gradeFlashcard("non-existent-id", "user-1", "correct")).rejects.toThrow(
        "Flashcard not found or user does not have access."
      );
    });

    it("should throw an error if the update operation fails", async () => {
      const currentFlashcard = { id: "1", leitner_box: 1 };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: currentFlashcard, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: new Error("Update failed") });

      await expect(studyService.gradeFlashcard("1", "user-1", "correct")).rejects.toThrow(
        "Could not update the flashcard."
      );
    });
  });
});

describe("calculateNextReviewDate", () => {
  beforeAll(() => {
    // Freeze time to make date calculations predictable
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterAll(() => {
    // Restore real timers
    vi.useRealTimers();
  });

  it.each([
    { box: 1, expectedDays: 1 },
    { box: 2, expectedDays: 3 },
    { box: 3, expectedDays: 7 },
    { box: 4, expectedDays: 14 },
    { box: 5, expectedDays: 30 },
  ])("should return the date $expectedDays days in the future for box $box", ({ box, expectedDays }) => {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + expectedDays);
    expect(calculateNextReviewDate(box)).toBe(expectedDate.toISOString());
  });

  it("should throw an error for an invalid Leitner box number", () => {
    expect(() => calculateNextReviewDate(0)).toThrow("Invalid Leitner box number: 0. Must be between 1 and 5.");
    expect(() => calculateNextReviewDate(6)).toThrow("Invalid Leitner box number: 6. Must be between 1 and 5.");
  });
});
