/**
 * This file contains the Data Transfer Object (DTO) and Command Model types
 * for the API layer. These types are derived from the database entity types
 * located in `src/db/database.types.ts` to ensure consistency between
 * the database and the API.
 */
import type { Enums, Tables, TablesInsert, TablesUpdate } from "./db/database.types";
import { z } from "zod";

// ###########################################################################
// #
// # OPEN ROUTER SCHEMAS
// #
// ###########################################################################

export const flashcardSchema = z.object({
  question: z.string().describe("The question or front side of the flashcard."),
  answer: z.string().describe("The answer or back side of the flashcard."),
});

export const flashcardSetSchema = z.object({
  flashcards: z.array(flashcardSchema).describe("An array of generated flashcards."),
});

export type Flashcard = z.infer<typeof flashcardSchema>;
export type FlashcardSet = z.infer<typeof flashcardSetSchema>;

// ###########################################################################
// #
// # GENERIC API TYPES
// #
// ###########################################################################

/**
 * Represents the structure of a paginated API response.
 * @template T The type of the data items in the response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ###########################################################################
// #
// # FLASHCARD RESOURCE
// #
// ###########################################################################

/**
 * DTO for a flashcard.
 * Represents the public-facing structure of a flashcard object.
 */
export type FlashcardDto = Tables<"flashcards">;

/**
 * DTO for a paginated list of flashcards.
 */
export type PaginatedFlashcardsDto = PaginatedResponse<FlashcardDto>;

/**
 * Command model for creating a new flashcard manually.
 * It only includes the properties required from the client.
 */
export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back">;

/**
 * Command model for updating an existing flashcard.
 * All properties are optional, allowing for partial updates.
 */
export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;

/**
 * Defines the possible outcomes of a flashcard review.
 */
export type ReviewOutcome = "correct" | "incorrect";

/**
 * Command model for submitting the result of a flashcard review.
 */
export interface GradeReviewCommand {
  outcome: ReviewOutcome;
}

// ###########################################################################
// #
// # AI SUGGESTIONS RESOURCE
// #
// ###########################################################################

/**
 * DTO for an AI-generated flashcard suggestion.
 * `source_text_hash` is omitted as it's an internal implementation detail.
 */
export type AiSuggestionDto = Omit<Tables<"ai_suggestions">, "source_text_hash">;

/**
 * Command model for generating AI flashcard suggestions from a block of text.
 */
export interface GenerateAiSuggestionsCommand {
  text: string;
}

/**
 * Command model for updating the status of an AI suggestion.
 * Primarily used for rejecting a suggestion. The status must be one of the
 * valid enum values.
 */
export interface UpdateAiSuggestionCommand {
  status: Enums<"suggestion_status">;
}
