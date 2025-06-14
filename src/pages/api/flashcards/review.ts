import type { APIRoute } from "astro";
import { StudyService } from "../../../lib/services/study.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const studyService = new StudyService(supabase);

  try {
    const reviewDeck = await studyService.getReviewDeck(user.id);
    return new Response(JSON.stringify(reviewDeck), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Basic error handling, assuming service layer might throw errors
    console.error(error);
    return new Response(JSON.stringify({ message: "Failed to fetch review deck" }), {
      status: 500,
    });
  }
}; 