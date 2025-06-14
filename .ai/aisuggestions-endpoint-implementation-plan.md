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

# Uzupełnienie Planu Implementacji API: AI Suggestions

Ten dokument stanowi uzupełnienie planu wdrożenia dla zasobu `/ai-suggestions` i opisuje implementację dla metod `GET`, `POST /{id}/accept` oraz `PATCH /{id}`.

---

# API Endpoint Implementation Plan: GET /ai-suggestions

## 1. Przegląd punktu końcowego

Punkt końcowy służy do pobierania listy sugestii fiszek wygenerowanych przez AI dla zalogowanego użytkownika. Domyślnie zwraca sugestie o statusie `pending`, ale umożliwia filtrowanie po innych statusach.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/ai-suggestions`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**:
    - `status` (query param, string): Filtruje sugestie po statusie. Dopuszczalne wartości: `pending`, `accepted`, `rejected`. Domyślnie: `pending`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO**: `AiSuggestionDto` (z `src/types.ts`) - używany w tablicy odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `200 OK`
  - **Content**: Tablica obiektów `AiSuggestionDto`.
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
- **Błąd**:
  - **Kod**: `400 Bad Request`
  - **Kod**: `401 Unauthorized`
  - **Kod**: `500 Internal Server Error`

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu Astro w `src/pages/api/ai-suggestions/index.ts`.
2.  Middleware Astro weryfikuje sesję użytkownika. W przypadku braku sesji zwraca `401 Unauthorized`.
3.  Endpoint waliduje opcjonalny parametr `status` za pomocą Zod. Jeśli jest nieprawidłowy, zwraca `400 Bad Request`.
4.  Wywoływana jest metoda z serwisu `AiSuggestionService`, np. `getSuggestions(userId, status)`.
5.  Serwis wykonuje zapytanie do bazy Supabase, pobierając dane z tabeli `ai_suggestions`. Zapytanie filtruje wyniki po `user_id` (z `Astro.locals.user.id`) oraz `status`.
6.  Polityka RLS na tabeli `ai_suggestions` zapewnia, że użytkownik może odczytać tylko własne sugestie.
7.  Serwis zwraca listę sugestii do endpointu.
8.  Endpoint serializuje dane do formatu JSON i zwraca odpowiedź `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Middleware Astro (`src/middleware/index.ts`) będzie odpowiedzialne za weryfikację tokenu sesji i odrzucanie żądań bez ważnej sesji.
- **Autoryzacja**: Dostęp do danych jest ograniczony na poziomie bazy danych przez polityki Row-Level Security (RLS) w tabeli `ai_suggestions`, które gwarantują, że użytkownicy widzą tylko swoje sugestie.
- **Walidacja wejścia**: Parametr `status` musi być walidowany, aby zapobiec nieoczekiwanym zapytaniom do bazy danych.

## 7. Obsługa błędów

- `400 Bad Request`: Zwracany, gdy parametr `status` zawiera niedozwoloną wartość. Odpowiedź powinna zawierać szczegóły błędu walidacji Zod.
- `401 Unauthorized`: Zwracany przez middleware, gdy użytkownik nie jest zalogowany.
- `500 Internal Server Error`: Zwracany w przypadku problemów z połączeniem z bazą danych lub innych nieoczekiwanych błędów serwera. Błąd powinien być logowany.

## 8. Rozważania dotyczące wydajności

- Aby zapewnić szybkie odpowiedzi, na tabeli `ai_suggestions` musi istnieć złożony indeks na kolumnach `(user_id, status)`. Zostało to przewidziane w planie bazy danych (`idx_ai_suggestions_user_status`).
- Należy rozważyć paginację, jeśli użytkownik może mieć bardzo dużą liczbę sugestii, chociaż dla statusu `pending` jest to mało prawdopodobne. Na razie MVP nie wymaga paginacji dla tego endpointu.

## 9. Etapy wdrożenia

1.  **Serwis**: W `src/lib/services/AiSuggestionService.ts` zaimplementować metodę `getSuggestions(userId: string, status: suggestion_status)`.
2.  **Walidacja**: W pliku endpointu zdefiniować schemat Zod do walidacji parametru `status`.
3.  **Endpoint**: W `src/pages/api/ai-suggestions/index.ts` dodać handler dla metody `GET`.
4.  **Logika**: W handlerze zaimplementować pobieranie i walidację `status`, wywołanie serwisu i zwrócenie odpowiedzi.
5.  **Testy**: Dodać testy jednostkowe dla serwisu oraz testy E2E dla endpointu, sprawdzające poprawną odpowiedź, obsługę błędów i filtrowanie.

---

# API Endpoint Implementation Plan: POST /ai-suggestions/{id}/accept

## 1. Przegląd punktu końcowego

Punkt końcowy do akceptacji sugestii AI. Jego wywołanie jest operacją transakcyjną, która tworzy nową fiszkę (`flashcard`) na podstawie sugestii i zmienia status samej sugestii na `accepted`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/ai-suggestions/[id]/accept`
- **Parametry**:
  - **Wymagane**:
    - `id` (path param, uuid): Identyfikator sugestii do zaakceptowania.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO**: `FlashcardDto` (z `src/types.ts`) - zwracany w przypadku sukcesu.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `201 Created`
  - **Content**: Nowo utworzony obiekt fiszki (`FlashcardDto`).
- **Błąd**:
  - **Kod**: `401 Unauthorized`
  - **Kod**: `404 Not Found`
  - **Kod**: `409 Conflict`
  - **Kod**: `500 Internal Server Error`

## 5. Przepływ danych

1.  Żądanie `POST` trafia do dynamicznego endpointu Astro `src/pages/api/ai-suggestions/[id]/accept.ts`.
2.  Middleware weryfikuje sesję użytkownika.
3.  Endpoint waliduje parametr `id` z URL (musi być poprawnym UUID).
4.  Wywoływana jest metoda z serwisu, np. `AiSuggestionService.acceptSuggestion(suggestionId, userId)`.
5.  **Kluczowy krok**: Serwis (`AiSuggestionService`) zarządza transakcją w bazie danych, aby zapewnić atomowość operacji.
6.  **Logika transakcji w serwisie**:
    a. Serwis rozpoczyna transakcję przy użyciu klienta Supabase.
    b. W ramach transakcji odczytuje sugestię (`ai_suggestions`) o podanym `id`.
    c. Weryfikuje, czy sugestia istnieje, należy do zalogowanego użytkownika (`userId`) i ma status `pending`. Jeśli nie, przerywa transakcję i zwraca błąd, który kontroler mapuje na `404 Not Found` lub `409 Conflict`.
    d. Wstawia nowy rekord do tabeli `flashcards`, używając danych z sugestii (`front_suggestion`, `back_suggestion`) i ustawiając `source: 'ai'`. Unikalne ograniczenie `(user_id, front)` w tabeli `flashcards` automatycznie zapobiegnie duplikatom.
    e. Aktualizuje status sugestii w `ai_suggestions` na `accepted`.
    f. Zatwierdza (commit) transakcję. Jeśli którykolwiek krok zawiedzie, klient bazy danych automatycznie wycofa (rollback) wszystkie zmiany.
    g. Zwraca nowo utworzoną fiszkę.
7.  Serwis zwraca nowo utworzoną fiszkę do endpointu.
8.  Endpoint zwraca odpowiedź `201 Created` z nową fiszką.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane, obsługiwane przez middleware.
- **Autoryzacja**: Sprawdzanie właściciela sugestii odbywa się wewnątrz serwisu przed wykonaniem operacji. Dodatkowo polityki RLS w bazie danych zapewniają, że użytkownik operuje tylko na własnych danych.
- **Transakcyjność**: Logika biznesowa jest opakowana w transakcję na poziomie aplikacji przy użyciu klienta Supabase. Gwarantuje to spójność danych – jeśli jakikolwiek krok (np. wstawienie fiszki, aktualizacja sugestii) zawiedzie, cała operacja zostanie wycofana.
- **Walidacja wejścia**: Parametr `id` musi być walidowany jako UUID.

## 7. Obsługa błędów

- `401 Unauthorized`: Użytkownik nie jest zalogowany.
- `404 Not Found`: Sugestia o podanym `id` nie istnieje lub nie należy do użytkownika.
- `409 Conflict`: Sugestia została już przetworzona (np. ma status inny niż `pending`) lub fiszka z takim samym `front` już istnieje dla tego użytkownika (błąd z unikalnego ograniczenia w bazie danych).
- `500 Internal Server Error`: Wystąpił błąd podczas wykonywania transakcji w bazie danych.

## 8. Rozważania dotyczące wydajności

- Operacja dotyczy pojedynczych wierszy i jest wywoływana na żądanie użytkownika, więc nie przewiduje się problemów z wydajnością. Indeksy na kluczach głównych i obcych są wystarczające.

## 9. Etapy wdrożenia

1.  **Serwis**: W `AiSuggestionService.ts` dodać metodę `acceptSuggestion(suggestionId, userId)`, która implementuje logikę transakcyjną przy użyciu klienta Supabase.
2.  **Endpoint**: Utworzyć plik `src/pages/api/ai-suggestions/[id]/accept.ts`.
3.  **Logika**: W handlerze `POST` zaimplementować walidację `id`, wywołanie serwisu i obsługę odpowiedzi/błędów.
4.  **Testy**: Dodać testy jednostkowe dla serwisu, mockując klienta bazy danych i sprawdzając poprawność wywołań w ramach transakcji. Dodać testy E2E dla endpointu, obejmujące scenariusze sukcesu i błędów (404, 409).

---

# API Endpoint Implementation Plan: PATCH /ai-suggestions/{id}

## 1. Przegląd punktu końcowego

Głównym zadaniem tego punktu końcowego jest umożliwienie użytkownikowi odrzucenia sugestii AI poprzez zmianę jej statusu na `rejected`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/ai-suggestions/[id]`
- **Parametry**:
  - **Wymagane**:
    - `id` (path param, uuid): Identyfikator sugestii.
- **Request Body**:
  ```json
  {
    "status": "rejected"
  }
  ```

## 3. Wykorzystywane typy

- **Command Model**: `UpdateAiSuggestionCommand` (z `src/types.ts`)
- **DTO**: `AiSuggestionDto` (z `src/types.ts`)

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `200 OK`
  - **Content**: Zaktualizowany obiekt `AiSuggestionDto`.
- **Błąd**:
  - **Kod**: `400 Bad Request`
  - **Kod**: `401 Unauthorized`
  - **Kod**: `404 Not Found`

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do `src/pages/api/ai-suggestions/[id].ts`.
2.  Middleware weryfikuje sesję użytkownika.
3.  Endpoint waliduje `id` z URL oraz ciało żądania (za pomocą schemy Zod dla `UpdateAiSuggestionCommand`). Ciało musi zawierać `status` o wartości `rejected`.
4.  Wywoływana jest metoda serwisu, np. `AiSuggestionService.updateSuggestion(suggestionId, userId, updateData)`.
5.  Serwis wykonuje zapytanie `UPDATE` do tabeli `ai_suggestions`, ustawiając nowy status dla wiersza o podanym `id`.
6.  Polityka RLS zapewnia, że użytkownik może modyfikować tylko własne sugestie.
7.  Zapytanie `UPDATE` zwraca zaktualizowany rekord.
8.  Serwis przekazuje zaktualizowany obiekt do endpointu.
9.  Endpoint zwraca odpowiedź `200 OK` ze zaktualizowaną sugestią.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane.
- **Autoryzacja**: Obsługiwana przez RLS, które uniemożliwia modyfikację cudzych zasobów.
- **Walidacja wejścia**: Ciało żądania musi być ściśle walidowane, aby zezwolić tylko na dozwolone zmiany (np. zmianę statusu tylko na `rejected`).

## 7. Obsługa błędów

- `400 Bad Request`: Nieprawidłowe `id` (nie jest UUID) lub nieprawidłowe ciało żądania (np. brak pola `status` lub niedozwolona wartość).
- `401 Unauthorized`: Użytkownik niezalogowany.
- `404 Not Found`: Próba aktualizacji sugestii, która nie istnieje lub nie należy do użytkownika. Zapytanie `UPDATE` w Supabase nie znajdzie wiersza do aktualizacji, co należy zmapować na kod 404.

## 8. Rozważania dotyczące wydajności

- Prosta, indeksowana operacja `UPDATE`. Brak problemów z wydajnością.

## 9. Etapy wdrożenia

1.  **Walidacja**: Zdefiniować schemę Zod dla `UpdateAiSuggestionCommand`.
2.  **Serwis**: W `AiSuggestionService.ts` zaimplementować metodę `updateSuggestion`.
3.  **Endpoint**: W `src/pages/api/ai-suggestions/[id].ts` dodać handler dla metody `PATCH`.
4.  **Logika**: W handlerze zaimplementować walidację, wywołanie serwisu i zwrócenie odpowiedzi.
5.  **Testy**: Dodać testy jednostkowe dla serwisu oraz testy E2E dla endpointu, sprawdzające scenariusz odrzucenia sugestii i obsługę błędów.
