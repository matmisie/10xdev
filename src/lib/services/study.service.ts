import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlashcardDto, ReviewOutcome } from "../../types";

const LEITNER_INTERVALS_IN_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

/**
 * Calculates the next review date based on the Leitner box number.
 * @param leitnerBox The Leitner box number (1-5).
 * @returns The ISO string for the next review date.
 * @throws {Error} if the leitnerBox is outside the valid range (1-5).
 */
export function calculateNextReviewDate(leitnerBox: number): string {
  const daysToAdd = LEITNER_INTERVALS_IN_DAYS[leitnerBox];

  if (daysToAdd === undefined) {
    throw new Error(`Invalid Leitner box number: ${leitnerBox}. Must be between 1 and 5.`);
  }

  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
}

export class StudyService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Retrieves a deck of flashcards due for review for a specific user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of flashcard DTOs.
   */
  async getReviewDeck(userId: string): Promise<FlashcardDto[]> {
    const today = new Date().toISOString();

    const { data: flashcards, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .lte("next_review_at", today);

    if (error) {
      throw new Error("Could not fetch flashcards for review.");
    }

    return flashcards || [];
  }

  /**
   * Grades a flashcard based on the user's review outcome, updates its
   * Leitner box, and schedules the next review.
   * @param flashcardId The ID of the flashcard to grade.
   * @param userId The ID of the user performing the review.
   * @param outcome The review outcome ('correct' or 'incorrect').
   * @returns A promise that resolves to the updated flashcard DTO.
   * @throws {Error} if the flashcard is not found or cannot be updated.
   */
  async gradeFlashcard(flashcardId: string, userId: string, outcome: ReviewOutcome): Promise<FlashcardDto> {
    // 1. Fetch the current flashcard to get its leitner_box
    const { data: currentFlashcard, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("id, leitner_box")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !currentFlashcard) {
      throw new Error("Flashcard not found or user does not have access.");
    }

    // 2. Calculate new Leitner box
    let newLeitnerBox: number;
    if (outcome === "correct") {
      newLeitnerBox = Math.min(currentFlashcard.leitner_box + 1, 5);
    } else {
      newLeitnerBox = 1;
    }

    // 3. Calculate next review date
    const nextReviewDate = calculateNextReviewDate(newLeitnerBox);

    // 4. Update the flashcard in the database
    const { data: updatedFlashcard, error: updateError } = await this.supabase
      .from("flashcards")
      .update({
        leitner_box: newLeitnerBox,
        next_review_at: nextReviewDate,
      })
      .eq("id", flashcardId)
      .select()
      .single();

    if (updateError || !updatedFlashcard) {
      throw new Error("Could not update the flashcard.");
    }

    return updatedFlashcard;
  }
}
