# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

`OpenRouterService` to usługa po stronie serwera, odpowiedzialna za komunikację z API OpenRouter. Jej głównym zadaniem jest abstrakcja złożoności związanej z wywołaniami API, zarządzaniem kluczami, budowaniem zapytań i obsługą odpowiedzi. Usługa będzie wykorzystywana do generowania fiszek edukacyjnych na podstawie tekstu dostarczonego przez użytkownika, zwracając ustrukturyzowane dane w formacie JSON.

## 2. Opis konstruktora

Konstruktor klasy `OpenRouterService` będzie odpowiedzialny za inicjalizację usługi, wczytując konfigurację z zmiennych środowiskowych.

```typescript
// src/lib/openrouter.ts

import { z } from "zod";
import { flashcardSetSchema } from "@/types"; // Zdefiniujemy to później

type OpenRouterServiceOptions = {
  apiKey?: string;
  baseUrl?: string;
};

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: OpenRouterServiceOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY;
    this.baseUrl = options.baseUrl ?? "https://openrouter.ai/api/v1";

    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set in environment variables.");
    }
  }

  // ... metody
}
```

## 3. Publiczne metody i pola

### `public async generateFlashcards(text: string, options?: GenerateOptions): Promise<FlashcardSet>`

Jest to główna metoda publiczna, która będzie wywoływana przez inne części aplikacji (np. przez API endpoint w Astro).

- **Parametry:**
  - `text: string`: Tekst źródłowy od użytkownika, z którego mają powstać fiszki.
  - `options?: GenerateOptions`: Opcjonalny obiekt do nadpisywania domyślnych parametrów, takich jak nazwa modelu czy `temperature`.
- **Zwraca:** `Promise<FlashcardSet>`, gdzie `FlashcardSet` to typ zdefiniowany w `src/types.ts`, zgodny ze schematem JSON.
- **Obsługa błędów:** Metoda może rzucać własne typy błędów (`ApiError`, `ValidationError`) w przypadku problemów z komunikacją z API lub walidacją odpowiedzi.

**Typy pomocnicze:**

```typescript
// src/types.ts
import { z } from "zod";

export const flashcardSchema = z.object({
  question: z.string().describe("The question or front side of the flashcard."),
  answer: z.string().describe("The answer or back side of the flashcard."),
});

export const flashcardSetSchema = z.object({
  flashcards: z.array(flashcardSchema).describe("An array of generated flashcards."),
});

export type Flashcard = z.infer<typeof flashcardSchema>;
export type FlashcardSet = z.infer<typeof flashcardSetSchema>;

// src/lib/openrouter.ts
export type GenerateOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};
```

## 4. Prywatne metody i pola

### `private async executeApiCall(payload: object): Promise<any>`

Prywatna metoda do obsługi samego wywołania `fetch`.

- **Funkcjonalność:**
  1. Ustawia niezbędne nagłówki (`Authorization`, `Content-Type`).
  2. Wykonuje żądanie `POST` do API OpenRouter.
  3. Sprawdza status odpowiedzi HTTP. Jeśli status wskazuje na błąd (>= 400), rzuca `ApiError` z odpowiednim komunikatem i kodem statusu.
  4. Zwraca odpowiedź w formacie JSON.

### `private buildRequestPayload(text: string, options: GenerateOptions): object`

Metoda pomocnicza do konstruowania obiektu żądania (payload) zgodnie ze specyfikacją OpenRouter.

- **Funkcjonalność:**
  1. **System Prompt:** Definiuje rolę i cel AI.
  2. **User Prompt:** Wstawia tekst od użytkownika.
  3. **Model:** Używa modelu z `options` lub domyślnego (`anthropic/claude-3-haiku-20240307`).
  4. **Parameters:** Ustawia `temperature` i `max_tokens`.
  5. **Response Format:** Tworzy strukturę `response_format` w oparciu o `zod-to-json-schema` do generowania schematu z `flashcardSetSchema`.

**Przykład implementacji `response_format`:**

```typescript
import { zodToJsonSchema } from "zod-to-json-schema";

// wewnątrz buildRequestPayload
const jsonSchema = zodToJsonSchema(flashcardSetSchema, {
  name: "flashcard_set_schema",
  strict: true,
});

const payload = {
  model: options.model ?? "anthropic/claude-3-haiku-20240307",
  temperature: options.temperature ?? 0.2,
  max_tokens: options.maxTokens ?? 2048,
  messages: [
    {
      role: "system",
      content:
        "You are an expert in creating effective educational flashcards. Your task is to generate a set of flashcards based on the user's text. Each flashcard must have a clear question (front) and a concise answer (back). Respond ONLY with the JSON object matching the provided schema.",
    },
    { role: "user", content: text },
  ],
  response_format: {
    type: "json_schema",
    // @ts-ignore
    json_schema: jsonSchema,
  },
};
```

### `private validateAndParseResponse(response: any): FlashcardSet`

Metoda do walidacji odpowiedzi API przy użyciu Zod.

- **Funkcjonalność:**
  1. Pobiera dane z `response.choices[0].message.content`.
  2. Parsuje string JSON na obiekt. Obsługuje błędy parsowania.
  3. Używa `flashcardSetSchema.safeParse()` do walidacji obiektu.
  4. Jeśli walidacja się nie powiedzie, rzuca `ValidationError` ze szczegółami błędu.
  5. Jeśli się powiedzie, zwraca zwalidowane dane typu `FlashcardSet`.

## 5. Obsługa błędów

Należy zdefiniować własne klasy błędów, aby umożliwić ich precyzyjne przechwytywanie i obsługę w warstwie wyżej (np. w API endpoint).

```typescript
// src/lib/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly validationIssues?: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

**Scenariusze błędów:**

1.  **Brak klucza API:** Konstruktor rzuca błąd `Error`.
2.  **Błąd sieci lub serwera (5xx):** `executeApiCall` rzuca `ApiError` ze statusem `503`.
3.  **Błąd po stronie klienta (4xx):**
    - `401 Unauthorized`: `ApiError` ze statusem `401` (nieprawidłowy klucz).
    - `429 Too Many Requests`: `ApiError` ze statusem `429` (przekroczony limit).
    - `400 Bad Request`: `ApiError` ze statusem `400` (błąd w zapytaniu).
4.  **Nieprawidłowy JSON w odpowiedzi:** `validateAndParseResponse` rzuca `ValidationError`.
5.  **Niezgodność ze schematem:** `validateAndParseResponse` rzuca `ValidationError` ze szczegółami od Zod.

## 6. Kwestie bezpieczeństwa

1.  **Klucz API:** Klucz API OpenRouter musi być przechowywany wyłącznie jako zmienna środowiskowa (`OPENROUTER_API_KEY`) na serwerze. Nigdy nie może być ujawniony po stronie klienta. Plik `.env` powinien być dodany do `.gitignore`.
2.  **Walidacja danych wejściowych:** Tekst od użytkownika (`text`) powinien być traktowany jako niezaufany. Chociaż w tym przypadku jest przekazywany do zewnętrznego API, należy unikać jego bezpośredniego renderowania w HTML bez odpowiedniego oczyszczenia, aby zapobiec XSS (nie dotyczy to bezpośrednio tej usługi, ale jest ważne dla całej aplikacji).
3.  **Ograniczenie zapytań:** Należy zaimplementować mechanizm rate limitingu na poziomie API endpointu (np. w `src/pages/api/...`), aby uniemożliwić nadużycia i ataki DoS, które mogłyby generować koszty.

## 7. Plan wdrożenia krok po kroku

1.  **Zainstaluj zależności:**

    ```bash
    npm install zod zod-to-json-schema
    ```

2.  ** skonfiguruj zmienne środowiskowe:**

    - Utwórz plik `.env` w głównym katalogu projektu.
    - Dodaj do niego swój klucz API: `OPENROUTER_API_KEY="sk-or-v1-..."`
    - Upewnij się, że plik `.env` jest wpisany w `.gitignore`.

3.  **Zdefiniuj typy i schematy:**

    - W pliku `src/types.ts` zdefiniuj typy `Flashcard`, `FlashcardSet` oraz schematy Zod `flashcardSchema` i `flashcardSetSchema`, jak pokazano w sekcji 3.

4.  **Utwórz plik dla błędów:**

    - Stwórz plik `src/lib/errors.ts` i zdefiniuj w nim klasy `ApiError` i `ValidationError`, jak pokazano w sekcji 5.

5.  **Zaimplementuj `OpenRouterService`:**

    - Stwórz plik `src/lib/openrouter.ts`.
    - Zaimplementuj klasę `OpenRouterService`, zaczynając od konstruktora.
    - Dodaj prywatne metody `buildRequestPayload`, `executeApiCall` i `validateAndParseResponse`, implementując logikę opisaną w sekcji 4.
    - Zaimplementuj publiczną metodę `generateFlashcards`, która będzie orkiestrować wywołania metod prywatnych. Pamiętaj o opakowaniu logiki w bloki `try...catch` do obsługi błędów.

6.  **Utwórz API Endpoint w Astro:**

    - Stwórz plik `src/pages/api/generate-flashcards.ts`.
    - Zaimplementuj endpoint `POST`, który:
      - Odczytuje tekst z ciała żądania.
      - Tworzy instancję `OpenRouterService`.
      - Wywołuje `service.generateFlashcards(text)`.
      - Przechwytuje błędy `ApiError` i `ValidationError` i zwraca odpowiednie kody statusu HTTP (np. 500, 400) wraz z komunikatem błędu w formacie JSON.
      - Zwraca wygenerowane fiszki z kodem statusu 200 w przypadku sukcesu.

    ```typescript
    // src/pages/api/generate-flashcards.ts
    import type { APIRoute } from "astro";
    import { OpenRouterService } from "@/lib/openrouter";
    import { ApiError, ValidationError } from "@/lib/errors";

    export const POST: APIRoute = async ({ request }) => {
      try {
        const body = await request.json();
        const text = body.text;

        if (!text || typeof text !== "string") {
          return new Response(JSON.stringify({ error: "Text is required." }), { status: 400 });
        }

        const service = new OpenRouterService();
        const flashcardSet = await service.generateFlashcards(text);

        return new Response(JSON.stringify(flashcardSet), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return new Response(JSON.stringify({ error: error.message }), { status: 400 });
        }
        if (error instanceof ApiError) {
          // Log the full error for debugging
          console.error(`API Error: ${error.status}`, error);
          return new Response(JSON.stringify({ error: "Failed to communicate with AI service." }), {
            status: error.status,
          });
        }
        // Log unexpected errors
        console.error("Unexpected error:", error);
        return new Response(JSON.stringify({ error: "An internal server error occurred." }), { status: 500 });
      }
    };
    ```

7.  **Testowanie:**
    - Użyj narzędzia takiego jak `curl` lub klienta API (np. Postman, Insomnia) do przetestowania endpointu `/api/generate-flashcards` z różnymi danymi wejściowymi, aby zweryfikować poprawność działania i obsługę błędów.
