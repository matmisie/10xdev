import type { APIRoute } from "astro";
import { z } from "zod";
import { aiSuggestionService } from "@/lib/services/aiSuggestionService";
import type { FlashcardDto } from "@/types";

export const prerender = false;

const IdParamSchema = z.object({
  id: z.string().uuid(),
});

function mapErrorToStatus(error: string): number {
  if (error.includes("not found")) return 404;
  if (error.includes("already been processed")) return 409;
  if (error.includes("Failed to create flashcard")) return 409; // Handles duplicates
  if (error.includes("Inconsistent state")) return 500;
  return 500;
}

export const POST: APIRoute = async ({ params, locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const validation = IdParamSchema.safeParse(params);

  if (!validation.success) {
    return new Response(JSON.stringify(validation.error.flatten()), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const suggestionId = validation.data.id;

  const { data, error } = await aiSuggestionService.acceptSuggestion(supabase, suggestionId, user.id);

  if (error) {
    const status = mapErrorToStatus(error);
    return new Response(JSON.stringify({ message: error }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const responseDto: FlashcardDto = data!;

  return new Response(JSON.stringify(responseDto), {
    status: 201, // 201 Created
    headers: { "Content-Type": "application/json" },
  });
}; 