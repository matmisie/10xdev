import type { APIRoute } from "astro";
import { z } from "zod";
import { StudyService } from "../../../../lib/services/study.service";

export const prerender = false;

const gradeReviewSchema = z.object({
  outcome: z.enum(["correct", "incorrect"]),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { user, supabase } = locals;

  // 1. Authentication
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // 2. Input validation
  const flashcardId = params.id;
  const idValidation = z.string().uuid().safeParse(flashcardId);
  if (!idValidation.success) {
    return new Response(JSON.stringify({ message: "Invalid flashcard ID format" }), {
      status: 400,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ message: "Invalid JSON body" }), { status: 400 });
  }

  const bodyValidation = gradeReviewSchema.safeParse(body);
  if (!bodyValidation.success) {
    return new Response(JSON.stringify({ message: "Invalid request body", errors: bodyValidation.error.flatten() }), {
      status: 400,
    });
  }

  // 3. Business logic
  const studyService = new StudyService(supabase);
  try {
    const updatedFlashcard = await studyService.gradeFlashcard(
      idValidation.data,
      user.id,
      bodyValidation.data.outcome,
    );
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 4. Error handling
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return new Response(JSON.stringify({ message: error.message }), { status: 404 });
      }
    }
    console.error("Error grading flashcard:", error);
    return new Response(JSON.stringify({ message: "Failed to grade flashcard" }), {
      status: 500,
    });
  }
}; 