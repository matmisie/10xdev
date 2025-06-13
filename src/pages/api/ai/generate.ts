import type { APIRoute } from "astro";
import { OpenRouterService } from "src/lib/openrouter.service";
import { ApiError, ValidationError } from "src/lib/errors";

export const POST: APIRoute = async ({ request, locals }) => {
  const { session, supabase } = locals;

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { text, count = 5 } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), { status: 400 });
    }

    const openrouterService = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
    const flashcards = await openrouterService.generateFlashcards(text, count);

    return new Response(JSON.stringify(flashcards), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ error: error.message, issues: error.validationIssues }), {
        status: 400,
      });
    }

    if (error instanceof ApiError) {
      return new Response(JSON.stringify({ error: error.message }), { status: error.status });
    }

    console.error(error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), { status: 500 });
  }
};
