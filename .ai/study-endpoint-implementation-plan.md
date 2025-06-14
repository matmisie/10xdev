# API Endpoint Implementation Plan: Study Session

## 1. Przegląd punktu końcowego

Ten plan opisuje wdrożenie dwóch powiązanych ze sobą punktów końcowych interfejsu API REST, które umożliwiają użytkownikom przeprowadzanie sesji nauki opartych na systemie powtórek Leitnera.

- `GET /api/flashcards/review`: Pobiera talię fiszek, które są zaplanowane do powtórki na dany dzień.
- `POST /api/flashcards/{id}/review`: Przetwarza ocenę pojedynczej fiszki po jej przejrzeniu przez użytkownika i aktualizuje jej harmonogram powtórek.

## 2. Szczegóły żądania

### A. Pobieranie fiszek do powtórki (`GET`)

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/flashcards/review`
- **Parametry**:
  - Wymagane: Brak. Identyfikator użytkownika jest pobierany z aktywnej sesji (cookie).
  - Opcjonalne: Brak.

### B. Ocenianie fiszki (`POST`)

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/flashcards/{id}/review`
- **Parametry**:
  - Wymagane:
    - `id` (parametr ścieżki): Unikalny identyfikator (UUID) ocenianej fiszki.
- **Request Body**: Wymagane jest ciało żądania w formacie JSON, które musi zawierać wynik oceny.
  ```json
  {
    "outcome": "correct"
  }
  ```
  lub
  ```json
  {
    "outcome": "incorrect"
  }
  ```

## 3. Wykorzystywane typy

Implementacja będzie korzystać z istniejących typów zdefiniowanych w `src/types.ts`:

- `FlashcardDto`: Struktura danych zwracana w odpowiedzi.
- `GradeReviewCommand`: Struktura danych dla ciała żądania POST, zawierająca `outcome`.
- `ReviewOutcome`: Typ wyliczeniowy (`"correct" | "incorrect"`) dla pola `outcome`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
  - Dla `GET /api/flashcards/review`: Tablica obiektów `FlashcardDto`.
  ```json
  [
    { "id": "...", "front": "...", "back": "...", "leitner_box": 1, ... },
    ...
  ]
  ```
  - Dla `POST /api/flashcards/{id}/review`: Pojedynczy obiekt `FlashcardDto` z zaktualizowanymi polami `leitner_box` i `next_review_at`.
- **Odpowiedzi błędu**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

### `GET /api/flashcards/review`

1.  Punkt końcowy Astro odbiera żądanie.
2.  Middleware weryfikuje sesję użytkownika. Jeśli jest nieprawidłowa, zwraca `401`.
3.  Wywoływana jest metoda `studyService.getReviewDeck(userId)`.
4.  Serwis wykonuje zapytanie do bazy danych Supabase, aby pobrać fiszki, dla których `user_id` jest zgodny i `next_review_at <= NOW()`.
5.  Punkt końcowy zwraca listę fiszek z kodem `200 OK`.

### `POST /api/flashcards/{id}/review`

1.  Punkt końcowy Astro odbiera żądanie.
2.  Middleware weryfikuje sesję użytkownika (`401` w przypadku błędu).
3.  Dane wejściowe (parametr `id` i ciało żądania) są walidowane przy użyciu `zod` (`400` w przypadku błędu).
4.  Wywoływana jest metoda `studyService.gradeFlashcard(id, userId, outcome)`.
5.  Serwis:
    a. Pobiera aktualny stan fiszki z bazy danych (jeśli nie znaleziono, zwraca błąd, który przekłada się na `404`).
    b. Oblicza nowy `leitner_box`: - Jeśli `outcome` to `"correct"`, `leitner_box` jest inkrementowany (maks. 5). - Jeśli `outcome` to `"incorrect"`, `leitner_box` jest resetowany do 1.
    c. Oblicza nową datę `next_review_at` na podstawie nowego `leitner_box` (np. 1 dzień dla box 1, 3 dni dla box 2, 7 dni dla box 3, itd.).
    d. Aktualizuje rekord fiszki w bazie danych.
    e. Zwraca zaktualizowaną fiszkę.
6.  Punkt końcowy zwraca zaktualizowaną fiszkę z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do obu punktów końcowych jest chroniony. Wymagana jest prawidłowa sesja użytkownika zarządzana przez Supabase. Brak sesji lub nieważny token spowoduje odpowiedź `401 Unauthorized`.
- **Autoryzacja**: Polityki Row-Level Security (RLS) w bazie danych PostgreSQL zapewniają, że użytkownicy mogą odczytywać i modyfikować wyłącznie własne fiszki. Logika serwisu musi zawsze przekazywać `userId` do zapytań bazodanowych.
- **Walidacja danych**: Wszystkie dane wejściowe z żądania (parametry URL, ciało żądania) muszą być rygorystycznie walidowane za pomocą `zod`, aby zapobiec nieoczekiwanym błędom i atakom.

## 7. Obsługa błędów

- `400 Bad Request`:
  - Wysyłane, gdy parametr `id` w URL nie jest prawidłowym UUID.
  - Wysyłane, gdy ciało żądania POST jest nieprawidłowe (np. brakuje pola `outcome` lub ma ono niedozwoloną wartość).
- `401 Unauthorized`: Wysyłane, gdy użytkownik nie jest uwierzytelniony.
- `404 Not Found`: Wysyłane, gdy fiszka o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
- `500 Internal Server Error`: Wysyłane w przypadku nieoczekiwanego błędu po stronie serwera (np. błąd połączenia z bazą danych).

## 8. Rozważania dotyczące wydajności

- Zapytanie o fiszki do powtórki (`GET`) będzie wykorzystywać złożony indeks `idx_flashcards_user_next_review` na kolumnach `(user_id, next_review_at)`, co zapewni wysoką wydajność nawet przy dużej liczbie fiszek.
- Operacje są ograniczone do jednego użytkownika, co naturalnie ogranicza zakres danych i obciążenie.

## 9. Etapy wdrożenia

1.  **Utworzenie serwisu**: Stworzyć plik `src/lib/services/study.service.ts`.
2.  **Implementacja logiki Leitnera**: W `study.service.ts` zaimplementować funkcję pomocniczą do obliczania `next_review_at` na podstawie `leitner_box`.
3.  **Implementacja `getReviewDeck`**: W `study.service.ts` zaimplementować metodę pobierającą fiszki do powtórki.
4.  **Implementacja `gradeFlashcard`**: W `study.service.ts` zaimplementować metodę do oceniania fiszki, aktualizacji jej stanu i zapisywania w bazie.
5.  **Utworzenie endpointu GET**: Stworzyć plik `src/pages/api/flashcards/review.ts`, który obsługuje żądania `GET`, wywołuje `studyService.getReviewDeck` i zwraca dane.
6.  **Utworzenie endpointu POST**: Stworzyć plik `src/pages/api/flashcards/[id]/review.ts`.
7.  **Walidacja w endpoincie POST**: W `[id]/review.ts`, dodać walidację `zod` dla parametru `id` i ciała żądania.
8.  **Integracja endpointu POST z serwisem**: Połączyć logikę endpointu z metodą `studyService.gradeFlashcard` i obsługiwać zwracane wyniki oraz błędy.
9.  **Testy jednostkowe**: Napisać testy jednostkowe dla logiki biznesowej w `study.service.ts`, zwłaszcza dla obliczeń systemu Leitnera.
10. **Testy E2E**: Napisać testy end-to-end dla obu punktów końcowych, aby zweryfikować cały przepływ, w tym uwierzytelnianie i obsługę błędów.
