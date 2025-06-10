# API Endpoint Implementation Plan: Generate AI Suggestions

## 1. Przegląd punktu końcowego

Ten punkt końcowy (`POST /ai-suggestions`) umożliwia uwierzytelnionym użytkownikom generowanie propozycji fiszek na podstawie dostarczonego tekstu. Wykorzystuje zewnętrzną usługę LLM do analizy tekstu i tworzenia par pytanie-odpowiedź. Wygenerowane sugestie są zapisywane w bazie danych ze statusem `pending`, co pozwala użytkownikowi na ich późniejszy przegląd i akceptację.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/ai-suggestions`
- **Nagłówki**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "text": "string"
  }
  ```
- **Walidacja (Zod Schema)**:

  ```typescript
  import { z } from "zod";

  export const GenerateAiSuggestionsSchema = z.object({
    text: z
      .string()
      .min(20, "Text must be at least 20 characters long.")
      .max(5000, "Text cannot exceed 5000 characters."),
  });
  ```

## 3. Wykorzystywane typy

- **Command Model (Request)**: `GenerateAiSuggestionsCommand` z `src/types.ts`.
- **DTO (Response)**: `AiSuggestionDto[]` z `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**:
  ```json
  [
    {
      "id": "suggestion-uuid-1",
      "user_id": "user-uuid",
      "batch_id": "batch-uuid",
      "front_suggestion": "What is the powerhouse of the cell?",
      "back_suggestion": "The mitochondria",
      "status": "pending",
      "created_at": "2023-10-27T12:00:00Z"
    }
  ]
  ```
- **Odpowiedzi błędu**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Użytkownik wysyła żądanie `POST` do `/api/ai-suggestions` z tekstem w ciele żądania.
2.  Middleware Astro weryfikuje sesję użytkownika.
3.  Kontroler (plik `src/pages/api/ai-suggestions.ts`):
    a. Sprawdza, czy sesja użytkownika istnieje. Jeśli nie, zwraca `401 Unauthorized`.
    b. Waliduje ciało żądania za pomocą schematu Zod. Jeśli jest nieprawidłowe, zwraca `400 Bad Request`.
    c. Wywołuje metodę w `AiSuggestionService`, przekazując tekst i ID użytkownika.
4.  Serwis (`src/lib/services/aiSuggestionService.ts`):
    a. Generuje unikalny `batch_id` dla tej operacji.
    b. Oblicza hash `SHA-256` z `source_text`.
    c. Wysyła żądanie do API Openrouter.ai, zawierające tekst źródłowy i odpowiednio skonstruowany prompt.
    d. Odbiera odpowiedź od LLM i parsuje ją, aby wyodrębnić sugestie fiszek (pary przód-tył).
    e. Mapuje sparsowane sugestie do struktury wymaganej przez tabelę `ai_suggestions` w bazie danych.
    f. Wykonuje operację `insert` na tabeli `ai_suggestions` w Supabase, zapisując wszystkie sugestie z jednego batcha.
    g. Zwraca listę nowo utworzonych sugestii do kontrolera.
5.  Kontroler:
    a. Otrzymuje dane z serwisu.
    b. Formatuje dane do postaci `AiSuggestionDto[]` (pomijając `source_text_hash`).
    c. Zwraca odpowiedź `201 Created` z listą sformatowanych sugestii.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony. Dostęp jest przyznawany tylko użytkownikom z ważną sesją, co jest weryfikowane przez `Astro.locals.session`.
- **Autoryzacja**: Operacje zapisu są autoryzowane na podstawie `user_id` pobranego z sesji. Użytkownik może tworzyć zasoby tylko w swoim imieniu.
- **Walidacja danych wejściowych**: Zod jest używany do ścisłej walidacji i typowania danych przychodzących, co zapobiega błędom i atakom takim jak NoSQL/SQL injection.
- **Zmienne środowiskowe**: Klucz API do Openrouter.ai (`OPENROUTER_API_KEY`) musi być przechowywany jako zabezpieczona zmienna środowiskowa i dostępny tylko po stronie serwera przez `import.meta.env`.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy dane wejściowe nie przejdą walidacji Zod. Odpowiedź powinna zawierać szczegóły błędu.
- **`401 Unauthorized`**: Zwracany, gdy żądanie jest wykonywane przez niezalogowanego użytkownika (brak `Astro.locals.session`).
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanego błędu po stronie serwera, np. błędu podczas zapisu do bazy danych. Szczegóły błędu powinny być logowane na serwerze (`console.error`).
- **`503 Service Unavailable`**: Zwracany, gdy komunikacja z API Openrouter.ai nie powiedzie się (np. timeout, błąd 5xx od LLM) lub gdy odpowiedź LLM ma nieprawidłowy format i nie może być sparsowana.

## 8. Rozważania dotyczące wydajności

- **Zewnętrzne wywołanie API**: Główne opóźnienie będzie pochodzić od wywołania API LLM. Operacja jest asynchroniczna i jej czas wykonania jest poza naszą bezpośrednią kontrolą.
- **Operacje na bazie danych**: Zamiast wstawiać każdą sugestię osobno, wszystkie sugestie z jednego żądania zostaną wstawione w jednej operacji `insert` (bulk insert), co jest znacznie bardziej wydajne.
- **Payload**: Ograniczenie maksymalnej długości tekstu wejściowego zapobiega przetwarzaniu zbyt dużych zapytań, co wpływa na wydajność i koszty.

## 9. Etapy wdrożenia

1.  **Utworzenie plików**:
    - Stwórz plik punktu końcowego API: `src/pages/api/ai-suggestions.ts`.
    - Stwórz plik serwisu: `src/lib/services/aiSuggestionService.ts`.
2.  **Definicja schematu walidacji**: W `src/pages/api/ai-suggestions.ts` zdefiniuj `GenerateAiSuggestionsSchema` przy użyciu Zod.
3.  **Implementacja kontrolera (Astro Endpoint)**:
    - W `src/pages/api/ai-suggestions.ts`, dodaj `export const prerender = false;`.
    - Zaimplementuj logikę `POST`, która:
      - Sprawdza sesję użytkownika (`Astro.locals.session`).
      - Pobiera i waliduje ciało żądania.
      - Wywołuje `aiSuggestionService`.
      - Obsługuje błędy i zwraca odpowiednie odpowiedzi HTTP.
4.  **Implementacja serwisu (`AiSuggestionService`)**:
    - Stwórz klasę `AiSuggestionService` lub zbiór funkcji w `src/lib/services/aiSuggestionService.ts`.
    - Zaimplementuj metodę, np. `generateAndStoreSuggestions(text: string, userId: string, db: SupabaseClient)`.
    - Wewnątrz metody, zaimplementuj logikę opisaną w sekcji "Przepływ danych": generowanie ID, hash, wywołanie `fetch` do Openrouter.ai, parsowanie odpowiedzi i zapis do bazy danych.
5.  **Konfiguracja zmiennych środowiskowych**: Upewnij się, że `.env` zawiera klucz `OPENROUTER_API_KEY`.
6.  **Testowanie**:
    - Napisz testy jednostkowe dla serwisu, mockując wywołanie `fetch` do LLM i klienta Supabase.
    - Przeprowadź testy integracyjne, wykonując rzeczywiste żądania do endpointu w środowisku deweloperskim. Przetestuj wszystkie ścieżki sukcesu i błędów.
7.  **Dokumentacja**: Upewnij się, że kod jest dobrze skomentowany, zwłaszcza logika interakcji z LLM i struktura promptu.
