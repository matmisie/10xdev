import type { APIRoute } from "astro";
import { z } from "zod";
import { aiSuggestionService } from "@/lib/services/aiSuggestionService";
import type { AiSuggestionDto, UpdateAiSuggestionCommand } from "@/types";

export const prerender = false;

const IdParamSchema = z.object({
  id: z.string().uuid(),
});

const UpdateSuggestionSchema = z.object({
  status: z.enum(["rejected"]), // Only allowing 'rejected' for now as per the plan
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const idValidation = IdParamSchema.safeParse(params);
  if (!idValidation.success) {
    return new Response(JSON.stringify(idValidation.error.flatten()), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const suggestionId = idValidation.data.id;

  const body = await request.json();
  const bodyValidation = UpdateSuggestionSchema.safeParse(body);

  if (!bodyValidation.success) {
    return new Response(JSON.stringify(bodyValidation.error.flatten()), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const command: UpdateAiSuggestionCommand = bodyValidation.data;

  const { data, error } = await aiSuggestionService.updateSuggestion(
    supabase,
    suggestionId,
    user.id,
    command,
  );

  if (error) {
    const status = error.includes("Failed to update") ? 404 : 500;
    return new Response(JSON.stringify({ message: error }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const responseDto: AiSuggestionDto = {
    id: data!.id,
    user_id: data!.user_id,
    batch_id: data!.batch_id,
    front_suggestion: data!.front_suggestion,
    back_suggestion: data!.back_suggestion,
    status: data!.status,
    created_at: data!.created_at,
  };

  return new Response(JSON.stringify(responseDto), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}; 