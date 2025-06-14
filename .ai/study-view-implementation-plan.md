# Plan implementacji widoku Sesja Nauki

## 1. Przegląd

Widok "Sesja Nauki" (`/app/study`) umożliwia użytkownikowi przeprowadzenie interaktywnej sesji powtórek fiszek, które są zaplanowane na dany dzień. Aplikacja prezentuje fiszki jedna po drugiej, zgodnie z zasadami systemu Leitnera. Użytkownik ocenia swoją znajomość odpowiedzi, co pozwala systemowi na aktualizację harmonogramu przyszłych powtórek. Widok obsługuje również stan, w którym nie ma fiszek do powtórzenia, oraz wyświetla podsumowanie po zakończeniu sesji.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- `/app/study`

Ta strona powinna być chroniona i dostępna tylko dla zalogowanych użytkowników.

## 3. Struktura komponentów

Komponenty zostaną zorganizowane w następującej hierarchii:

```
/src/pages/app/study.astro
└── StudyView (React Client Component)
    ├── LoadingSpinner (UI Component)
    ├── EmptyState (UI Component)
    ├── FlashcardDisplay (Component)
    │   └── Button "Pokaż odpowiedź"
    │   └── Button "Wiedziałem"
    │   └── Button "Nie wiedziałem"
    └── SessionSummary (Component)
        └── Button "Wróć do panelu"
```

- **`study.astro`**: Plik strony Astro, który renderuje komponent React `StudyView` w trybie `client:only`, ponieważ cała logika widoku jest interaktywna i wymaga stanu po stronie klienta.
- **`StudyView.tsx`**: Główny komponent React, który zarządza całym stanem i logiką sesji nauki. Wykorzystuje customowy hook `useStudySession`.
- **Pozostałe komponenty**: Komponenty UI odpowiedzialne za prezentację poszczególnych części interfejsu.

## 4. Szczegóły komponentów

### StudyView

- **Opis:** Główny kontener widoku sesji nauki. Renderuje odpowiedni stan interfejsu: ładowanie, pusty stan (brak fiszek), aktywną fiszkę lub podsumowanie sesji. Całą logiką zarządza za pomocą hooka `useStudySession`.
- **Główne elementy:**
  - Warunkowe renderowanie:
    - Komponent `LoadingSpinner`, gdy dane są pobierane.
    - Komponent `EmptyState`, jeśli nie ma fiszek do powtórki.
    - Komponent `FlashcardDisplay`, jeśli sesja jest w toku.
    - Komponent `SessionSummary`, gdy sesja jest zakończona.
- **Obsługiwane zdarzenia:** Brak bezpośrednich interakcji, deleguje obsługę do komponentów potomnych.
- **Typy:** `StudySessionState` (z hooka `useStudySession`).
- **Propsy:** Brak.

### FlashcardDisplay

- **Opis:** Wyświetla pojedynczą fiszkę (awers i rewers). Umożliwia użytkownikowi odkrycie odpowiedzi i ocenę swojej wiedzy.
- **Główne elementy:**
  - `<div>` wyświetlający `card.front`.
  - Warunkowo `<div>` wyświetlający `card.back`.
  - `Button` "Pokaż odpowiedź".
  - Warunkowo `Button` "Wiedziałem" i `Button` "Nie wiedziałem".
- **Obsługiwane zdarzenia:**
  - `onShowAnswer`: Kliknięcie przycisku "Pokaż odpowiedź".
  - `onGradeAnswer`: Kliknięcie przycisku "Wiedziałem" lub "Nie wiedziałem".
- **Warunki walidacji:** Brak.
- **Typy:** `Flashcard`, `GradeOutcome`.
- **Propsy:**
  - `card: Flashcard` - obiekt aktualnie wyświetlanej fiszki.
  - `isAnswerVisible: boolean` - flaga określająca, czy rewers karty jest widoczny.
  - `onShowAnswer: () => void` - funkcja do wywołania po kliknięciu "Pokaż odpowiedź".
  - `onGradeAnswer: (outcome: GradeOutcome) => void` - funkcja do oceny odpowiedzi.

### SessionSummary

- **Opis:** Wyświetla podsumowanie zakończonej sesji nauki.
- **Główne elementy:**
  - Tekst podsumowujący, np. "Gratulacje! Powtórzono X fiszek."
  - `Button` lub `Link` do nawigacji z powrotem do panelu głównego (`/app/dashboard`).
- **Obsługiwane zdarzenia:**
  - `onReturnToDashboard`: Kliknięcie przycisku powrotu.
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `reviewedCount: number` - liczba powtórzonych fiszek.

### EmptyState

- **Opis:** Informuje użytkownika, że nie ma żadnych fiszek zaplanowanych do powtórki na dany dzień.
- **Główne elementy:**
  - Tekst informacyjny, np. "Wszystko na dziś powtórzone! Wróć jutro."
  - `Button` lub `Link` do nawigacji z powrotem do panelu głównego (`/app/dashboard`).
- **Obsługiwane zdarzenia:** Brak.
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

```typescript
// src/types.ts - istniejący typ
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  leitner_box: number;
  next_review_at: string; // ISO 8601 date string
  created_at: string;
  updated_at: string;
}

// Typy dla logiki widoku
export type GradeOutcome = "correct" | "incorrect";

export type StudySessionStatus = "loading" | "studying" | "empty" | "summary";

export interface StudySessionState {
  status: StudySessionStatus;
  cards: Flashcard[];
  currentCardIndex: number;
  isAnswerVisible: boolean;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem zostanie scentralizowane w customowym hooku `useStudySession`, który będzie odpowiedzialny za całą logikę biznesową widoku.

**`useStudySession` hook:**

- **Cel:** Hermetyzacja logiki pobierania fiszek, śledzenia postępu sesji, obsługi odpowiedzi użytkownika i komunikacji z API.
- **Zwracany stan (`StudySessionState`):**
  - `status`: Aktualny stan sesji (`loading`, `studying`, `empty`, `summary`).
  - `cards`: Lista fiszek w bieżącej sesji.
  - `currentCardIndex`: Indeks aktualnie wyświetlanej fiszki.
  - `isAnswerVisible`: Flaga, czy odpowiedź jest widoczna.
  - `currentCard`: Aktualna fiszka (memoizowany selektor).
  - `reviewedCount`: Liczba już ocenionych fiszek.
- **Zwracane funkcje:**
  - `showAnswer()`: Ustawia `isAnswerVisible` na `true`.
  - `gradeAnswer(outcome: GradeOutcome)`: Wysyła ocenę do API, a po sukcesie przechodzi do następnej fiszki lub kończy sesję.
  - `restartSession()`: (Opcjonalnie) Umożliwia ponowne rozpoczęcie sesji.

## 7. Integracja API

Komunikacja z backendem będzie realizowana wewnątrz hooka `useStudySession`.

1.  **Pobieranie fiszek do powtórki:**

    - **Endpoint:** `GET /api/flashcards/review`
    - **Wywołanie:** Przy pierwszym renderowaniu komponentu `StudyView` (wewnątrz `useEffect` w `useStudySession`).
    - **Odpowiedź (sukces):** `200 OK` z `Flashcard[]`.
    - **Obsługa:**
      - Jeśli tablica jest pusta, stan sesji zmienia się na `empty`.
      - Jeśli tablica zawiera fiszki, stan zmienia się na `studying`, a fiszki są zapisywane w stanie.

2.  **Ocenianie fiszki:**
    - **Endpoint:** `POST /api/flashcards/{id}/review`
    - **Wywołanie:** Po kliknięciu "Wiedziałem" / "Nie wiedziałem" (funkcja `gradeAnswer`).
    - **Ciało żądania:** `{ "outcome": "correct" }` lub `{ "outcome": "incorrect" }`.
    - **Odpowiedź (sukces):** `200 OK` z zaktualizowanym obiektem `Flashcard`.
    - **Obsługa:** Po otrzymaniu odpowiedzi, `currentCardIndex` jest inkrementowany. Jeśli jest to ostatnia karta, stan sesji zmienia się na `summary`.

## 8. Interakcje użytkownika

- **Użytkownik wchodzi na `/app/study`:** Aplikacja wyświetla stan ładowania i wywołuje `GET /api/flashcards/review`.
- **Brak fiszek:** Wyświetlany jest komponent `EmptyState`.
- **Są fiszki:** Wyświetlana jest pierwsza fiszka (awers).
- **Użytkownik klika "Pokaż odpowiedź":** Odsłaniany jest rewers fiszki oraz przyciski "Wiedziałem" i "Nie wiedziałem".
- **Użytkownik klika "Wiedziałem" lub "Nie wiedziałem":**
  1. Wysyłane jest żądanie `POST /api/flashcards/{id}/review` z odpowiednim `outcome`.
  2. Po pomyślnej odpowiedzi, UI jest aktualizowane, aby pokazać następną fiszkę.
- **Użytkownik ocenia ostatnią fiszkę:** Wyświetlany jest komponent `SessionSummary`.
- **Użytkownik klika "Wróć do panelu" na ekranie podsumowania:** Jest przekierowywany do `/app/dashboard`.

## 9. Warunki i walidacja

- **Warunek:** Dostęp do widoku `/app/study` wymaga autoryzacji. Middleware Astro (`src/middleware/index.ts`) powinno zapewniać ochronę tej ścieżki.
- **Walidacja:** Główna walidacja po stronie klienta dotyczy payloadu dla API. Hook `useStudySession` musi gwarantować, że `outcome` w żądaniu `POST` jest zawsze jednym z dwóch dozwolonych ciągów znaków: `'correct'` lub `'incorrect'`.

## 10. Obsługa błędów

- **Błąd pobierania fiszek (`GET`):**
  - Jeśli API zwróci `401 Unauthorized`, użytkownik powinien zostać przekierowany na stronę logowania.
  - W przypadku innych błędów sieciowych lub serwera (`5xx`), należy wyświetlić generyczny komunikat o błędzie (np. za pomocą `react-hot-toast`) z opcją ponowienia próby.
- **Błąd oceniania fiszki (`POST`):**
  - `401 Unauthorized`: Przekierowanie na stronę logowania.
  - `404 Not Found`: Mało prawdopodobne w tym przepływie, ale można zignorować i przejść do następnej karty.
  - `400 Bad Request` lub `5xx`: Wyświetlenie komunikatu o błędzie, zablokowanie dalszej interakcji do czasu rozwiązania problemu (np. przez odświeżenie strony), aby uniknąć niespójności danych.

## 11. Kroki implementacji

1.  **Utworzenie pliku strony:** Stworzyć plik `/src/pages/app/study.astro`, który importuje i renderuje komponent `StudyView.tsx` z opcją `client:only`.
2.  **Stworzenie głównych komponentów:** Utworzyć pliki dla `StudyView.tsx`, `FlashcardDisplay.tsx`, `SessionSummary.tsx` i `EmptyState.tsx` w katalogu `/src/components/`.
3.  **Implementacja `useStudySession`:** Stworzyć plik `/src/hooks/useStudySession.ts`. Zaimplementować w nim logikę stanu, w tym:
    - Inicjalizację stanu.
    - `useEffect` do pobierania danych z `GET /api/flashcards/review` przy montowaniu komponentu.
    - Funkcje `showAnswer` i `gradeAnswer` (w tym wywołanie `POST /api/flashcards/{id}/review`).
4.  **Implementacja komponentu `StudyView`:** Połączyć hook `useStudySession` z komponentem, implementując logikę warunkowego renderowania w zależności od `sessionState.status`.
5.  **Implementacja komponentu `FlashcardDisplay`:** Zbudować komponent, który przyjmuje w propsach dane fiszki i funkcje zwrotne do obsługi interakcji.
6.  **Implementacja komponentów `SessionSummary` i `EmptyState`:** Zbudować proste komponenty prezentacyjne zgodnie z opisem.
7.  **Dodanie routingu i ochrony:** Upewnić się, że middleware (`/src/middleware/index.ts`) poprawnie chroni ścieżkę `/app/study`.
8.  **Styling:** Ostylować wszystkie komponenty przy użyciu Tailwind CSS i komponentów `shadcn/ui`, dbając o minimalistyczny i czytelny interfejs.
9.  **Testowanie:** Przetestować ręcznie wszystkie przepływy użytkownika: scenariusz z fiszkami, scenariusz bez fiszek, zakończenie sesji oraz obsługę błędów API.
