import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { v4 as uuidv4 } from "uuid";
import SHA256 from "crypto-js/sha256";

interface FlashcardSuggestion {
  front: string;
  back: string;
}

export class AiSuggestionService {
  public async generateAndStoreSuggestions(
    text: string,
    userId: string,
    db: SupabaseClient<Database>
  ) {
    try {
      const batchId = uuidv4();
      const sourceTextHash = SHA256(text).toString();

      const prompt = `Based on the text below, generate a list of flashcards. Each flashcard should have a 'front' (question) and a 'back' (answer). Provide the output as a JSON array of objects, where each object has 'front' and 'back' keys. Do not include any other text in your response, only the JSON array.

Text:
"""
${text}
"""`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        console.error("OpenRouter API error:", response.status, response.statusText);
        // In a real app, you'd throw a custom error to be caught by the controller
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

      const { data, error } = await db
        .from("ai_suggestions")
        .insert(suggestionsToInsert)
        .select();

      if (error) {
        console.error("Error inserting suggestions into database:", error);
        return { data: null, error: "Failed to save suggestions." };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      return { data: null, error: "An unexpected error occurred." };
    }
  }
}

export const aiSuggestionService = new AiSuggestionService(); 