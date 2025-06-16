import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums } from "@/db/database.types";
import { v4 as uuidv4 } from "uuid";
import SHA256 from "crypto-js/sha256";
import type { UpdateAiSuggestionCommand } from "@/types";

interface FlashcardSuggestion {
  front: string;
  back: string;
}

export class AiSuggestionService {
  public async getSuggestions(db: SupabaseClient<Database>, userId: string, status?: Enums<"suggestion_status">) {
    try {
      let query = db.from("ai_suggestions").select("*").eq("user_id", userId);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: "Failed to fetch suggestions." };
      }

      return { data, error: null };
    } catch {
      return { data: null, error: "An unexpected error occurred." };
    }
  }

  public async acceptSuggestion(db: SupabaseClient<Database>, suggestionId: string, userId: string) {
    try {
      // It's not straightforward to do a transaction with Supabase JS client v2 in edge functions.
      // A stored procedure (RPC) would be the best way to ensure atomicity.
      // For now, we'll perform the operations sequentially and accept the small risk of inconsistency.

      // 1. Get the suggestion
      const { data: suggestion, error: suggestionError } = await db
        .from("ai_suggestions")
        .select("*")
        .eq("id", suggestionId)
        .eq("user_id", userId)
        .single();

      if (suggestionError) {
        return { data: null, error: "Suggestion not found or access denied." };
      }

      if (suggestion.status !== "pending") {
        return { data: null, error: "Suggestion has already been processed." };
      }

      // 2. Create a new flashcard
      const { data: newFlashcard, error: flashcardError } = await db
        .from("flashcards")
        .insert({
          user_id: userId,
          front: suggestion.front_suggestion,
          back: suggestion.back_suggestion,
          source: "ai",
        })
        .select()
        .single();

      if (flashcardError) {
        if (flashcardError.code === "23505") {
          return { data: null, error: "Fiszka o tej treści już istnieje w Twojej kolekcji." };
        }
        return { data: null, error: "Nie udało się utworzyć fiszki na podstawie sugestii." };
      }

      // 3. Update the suggestion status
      const { error: updateError } = await db
        .from("ai_suggestions")
        .update({ status: "accepted" })
        .eq("id", suggestionId);

      if (updateError) {
        // At this point, a flashcard was created but the suggestion status was not updated.
        // This is where a transaction would be crucial. We'll log the error and return a server error.
        return { data: null, error: "Inconsistent state: Flashcard created, but suggestion status not updated." };
      }

      return { data: newFlashcard, error: null };
    } catch {
      return { data: null, error: "An unexpected error occurred while accepting the suggestion." };
    }
  }

  public async updateSuggestion(
    db: SupabaseClient<Database>,
    suggestionId: string,
    userId: string,
    command: UpdateAiSuggestionCommand
  ) {
    try {
      const { data, error } = await db
        .from("ai_suggestions")
        .update({ status: command.status })
        .eq("id", suggestionId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: "Failed to update suggestion." };
      }

      return { data, error: null };
    } catch {
      return { data: null, error: "An unexpected error occurred." };
    }
  }

  public async generateAndStoreSuggestions(text: string, userId: string, db: SupabaseClient<Database>) {
    try {
      const batchId = uuidv4();
      const sourceTextHash = SHA256(text).toString();

      const prompt = `Na podstawie poniższego tekstu wygeneruj listę fiszek w języku polskim. Każda fiszka powinna mieć „front” (pytanie) i „back” (odpowiedź). Podaj wynik jako tablicę obiektów JSON, gdzie każdy obiekt ma klucze „front” i „back”. Nie dołączaj żadnego innego tekstu do swojej odpowiedzi, tylko tablicę JSON.

Text:
"""
${text}
"""`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        return { data: null, error: "Failed to fetch suggestions from AI service." };
      }

      const completion = await response.json();
      const suggestionsJson = completion.choices[0].message.content;
      const suggestions: FlashcardSuggestion[] = JSON.parse(suggestionsJson);

      const suggestionsToInsert = suggestions.map((s) => ({
        id: uuidv4(),
        user_id: userId,
        batch_id: batchId,
        source_text_hash: sourceTextHash,
        front_suggestion: s.front,
        back_suggestion: s.back,
        status: "pending" as const,
      }));

      const { data, error } = await db.from("ai_suggestions").insert(suggestionsToInsert).select();

      if (error) {
        return { data: null, error: "Failed to save suggestions." };
      }

      return { data, error: null };
    } catch {
      return { data: null, error: "An unexpected error occurred." };
    }
  }
}

export const aiSuggestionService = new AiSuggestionService();
