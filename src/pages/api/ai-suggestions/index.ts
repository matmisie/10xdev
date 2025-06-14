import type { APIRoute } from "astro";
import { z } from "zod";
import type { AiSuggestionDto, GenerateAiSuggestionsCommand } from "@/types";
import { aiSuggestionService } from "@/lib/services/aiSuggestionService";
import type { Enums } from "@/db/database.types";

export const prerender = false;

// Schema for POST request
const GenerateAiSuggestionsSchema = z.object({
  text: z
    .string()
    .min(20, "Text must be at least 20 characters long.")
    .max(5000, "Text cannot exceed 5000 characters."),
});

// Schema for GET request query params
const GetAiSuggestionsSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
});

export const GET: APIRoute = async ({ locals, url }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validation = GetAiSuggestionsSchema.safeParse(queryParams);

  if (!validation.success) {
    return new Response(JSON.stringify(validation.error.flatten()), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const status = validation.data.status as Enums<"suggestion_status"> | undefined;

  const { data, error } = await aiSuggestionService.getSuggestions(supabase, user.id, status);

  if (error) {
    return new Response(JSON.stringify({ message: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const responseDto: AiSuggestionDto[] = (data || []).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    batch_id: s.batch_id,
    front_suggestion: s.front_suggestion,
    back_suggestion: s.back_suggestion,
    status: s.status,
    created_at: s.created_at,
  }));

  return new Response(JSON.stringify(responseDto), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const validation = GenerateAiSuggestionsSchema.safeParse(body);

  if (!validation.success) {
    return new Response(JSON.stringify(validation.error.flatten()), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const command: GenerateAiSuggestionsCommand = validation.data;

  const { data, error } = await aiSuggestionService.generateAndStoreSuggestions(
    command.text,
    user.id,
    supabase,
  );

  if (error) {
    // Basic error mapping, can be refined
    const status = error.includes("AI service") ? 503 : 500;
    return new Response(JSON.stringify({ message: error }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!data) {
    return new Response(JSON.stringify({ message: "No suggestions were generated." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const responseDto: AiSuggestionDto[] = data.map((s) => ({
    id: s.id,
    user_id: s.user_id,
    batch_id: s.batch_id,
    front_suggestion: s.front_suggestion,
    back_suggestion: s.back_suggestion,
    status: s.status,
    created_at: s.created_at,
  }));

  return new Response(JSON.stringify(responseDto), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
