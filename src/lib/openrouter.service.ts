import { zodToJsonSchema } from "zod-to-json-schema";
import { flashcardSetSchema, type Flashcard, type FlashcardSet } from "src/types";
import { ApiError, ValidationError } from "src/lib/errors";

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

export class OpenRouterService {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model = "openai/gpt-4o-mini") {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required.");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  public async generateFlashcards(text: string, count: number): Promise<Flashcard[]> {
    const payload = this.buildRequestPayload(text, count);
    const response = await this.sendRequest(payload);
    const flashcardSet = this.parseAndValidateResponse(response);
    return flashcardSet.flashcards;
  }

  private buildRequestPayload(text: string, count: number): object {
    const jsonSchemaObj = zodToJsonSchema(flashcardSetSchema);

    const finalSchemaPayload = {
      name: "create_flashcards",
      strict: true,
      schema: jsonSchemaObj,
    };

    return {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in creating effective educational flashcards. Your task is to generate a set of flashcards based on the user's text. Each flashcard must have a clear question (front) and a concise answer (back). Respond ONLY with the JSON object matching the provided schema.",
        },
        {
          role: "user",
          content: `Based on the following text, please generate a set of ${count} flashcards. Text: """${text}"""`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: finalSchemaPayload,
      },
      max_tokens: 4096,
      temperature: 0.2,
    };
  }

  private async sendRequest(payload: object): Promise<unknown> {
    const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await response.text();
      throw new ApiError(`API request failed with status ${response.status}`, response.status);
    }

    return response.json();
  }

  private parseAndValidateResponse(response: unknown): FlashcardSet {
    if (
      typeof response !== "object" ||
      response === null ||
      !("choices" in response) ||
      !Array.isArray(response.choices) ||
      response.choices.length === 0
    ) {
      throw new ValidationError("Invalid API response: No choices found.");
    }

    const firstChoice = response.choices[0];
    if (
      typeof firstChoice !== "object" ||
      firstChoice === null ||
      !("message" in firstChoice) ||
      typeof firstChoice.message !== "object" ||
      firstChoice.message === null ||
      !("content" in firstChoice.message) ||
      typeof firstChoice.message.content !== "string"
    ) {
      throw new ValidationError("Invalid API response: No content found.");
    }

    const content = firstChoice.message.content;

    try {
      const data = JSON.parse(content);
      const validationResult = flashcardSetSchema.safeParse(data);

      if (!validationResult.success) {
        throw new ValidationError("Validation failed", validationResult.error.flatten().fieldErrors);
      }

      return validationResult.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError("Failed to parse API response JSON.");
    }
  }
}
