# Architektura UI dla Inteligentne Fiszki

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji "Inteligentne Fiszki" została zaprojektowana w oparciu o model "wysp architektury" z wykorzystaniem Astro i React. Główne założenia to podział na strefę publiczną (dostępną dla niezalogowanych użytkowników) i prywatną (wymagającą uwierzytelnienia).

- **Strefa publiczna** (`/login`, `/register`): Minimalistyczne strony do obsługi uwierzytelniania, bez elementów nawigacyjnych aplikacji.
- **Strefa prywatna** (`/app/*`): Chroniona przez middleware, zawiera wszystkie kluczowe funkcje aplikacji. Użytkownicy w tej strefie mają dostęp do stałego układu z nawigacją.

Centralnym punktem aplikacji jest **Dashboard**, który promuje najważniejszą akcję — naukę — i zapewnia łatwy dostęp do tworzenia fiszek. Architektura kładzie nacisk na "focus modes" (tryby skupienia) dla kluczowych procesów, takich jak weryfikacja propozycji AI i sesja nauki, aby zminimalizować rozproszenie użytkownika. Zarządzanie stanem serwera opiera się na TanStack Query, co zapewnia optymistyczne aktualizacje UI i sprawną obsługę danych, podczas gdy stan globalny UI (np. blokada nawigacji) jest zarządzany przez Zustand. Projekt jest w pełni responsywny (mobile-first) i wykorzystuje predefiniowane komponenty z biblioteki Shadcn/ui w celu zapewnienia spójności wizualnej i dostępności.

## 2. Lista widoków

### Widok: Logowanie

- **Ścieżka:** `/login`
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika.
- **Kluczowe informacje:** Formularz logowania.
- **Kluczowe komponenty:**
  - `Card`: Kontener dla formularza.
  - `Input` z `Label`: Pola na e-mail i hasło.
  - `Button`: Przycisk do przesłania formularza.
  - Komunikaty walidacji po stronie klienta (Zod).
  - Link do widoku rejestracji.
- **UX, dostępność i względy bezpieczeństwa:** Jasne komunikaty o błędach logowania. Pola formularza mają odpowiednie etykiety dla czytników ekranu. Przekierowanie do `/app/dashboard` po pomyślnym logowaniu.

### Widok: Rejestracja

- **Ścieżka:** `/register`
- **Główny cel:** Utworzenie nowego konta użytkownika.
- **Kluczowe informacje:** Formularz rejestracji.
- **Kluczowe komponenty:**
  - `Card`: Kontener dla formularza.
  - `Input` z `Label`: Pola na e-mail i hasło.
  - `Button`: Przycisk do przesłania formularza.
  - Komunikaty o wymaganiach dotyczących hasła i walidacji.
  - Link do widoku logowania.
- **UX, dostępność i względy bezpieczeństwa:** Informacje zwrotne w czasie rzeczywistym o poprawności danych. Automatyczne zalogowanie i przekierowanie do `/app/dashboard` po pomyślnej rejestracji.

### Widok: Dashboard

- **Ścieżka:** `/app/dashboard`
- **Główny cel:** Centralny hub aplikacji, zapewniający szybki dostęp do kluczowych funkcji.
- **Kluczowe informacje:** Liczba fiszek do powtórki dzisiaj, opcje tworzenia fiszek.
- **Kluczowe komponenty:**
  - Główna karta (`Card`) z przyciskiem `Button` "Rozpocznij naukę", kierującym do `/app/study`.
  - Komponent `Tabs` z dwiema zakładkami:
    - **"Generator AI" (domyślna):** `Textarea` do wklejania notatek i przycisk `Button` "Generuj fiszki".
    - **"Dodaj ręcznie":** Formularz z polami `Input` ("Przód"), `Textarea` ("Tył") i przyciskiem `Button` "Dodaj fiszkę".
- **UX, dostępność i względy bezpieczeństwa:** Widok jasno priorytetyzuje naukę jako główną akcję. Formularze są proste i intuicyjne. Dostęp tylko dla zalogowanych użytkowników.

### Widok: Lista Fiszki

- **Ścieżka:** `/app/flashcards`
- **Główny cel:** Przeglądanie, zarządzanie i organizowanie wszystkich fiszek użytkownika.
- **Kluczowe informacje:** Lista fiszek z ich treścią.
- **Kluczowe komponenty:**
  - `FlashcardsList`: Komponent responsywny:
    - Desktop: `Table` z kolumnami "Przód", "Tył", "Akcje".
    - Mobile: Lista komponentów `Card`.
  - `Pagination`: Przyciski "Poprzednia" / "Następna" do nawigacji, stan przechowywany w parametrach URL.
  - `Button` "Edytuj" i `Button` "Usuń" dla każdej fiszki.
  - `EditFlashcardModal`: Modal do edycji treści fiszki.
  - `ConfirmationDialog`: Modal potwierdzający usunięcie fiszki.
  - `EmptyState`: Komunikat wyświetlany, gdy użytkownik nie ma jeszcze żadnych fiszek.
  - `LoadingSkeletons`: Animacja ładowania podczas pobierania danych.
- **UX, dostępność i względy bezpieczeństwa:** Responsywność zapewnia czytelność na każdym urządzeniu. Akcje edycji i usuwania są chronione dodatkowym potwierdzeniem, aby zapobiec przypadkowym działaniom. Paginacja zapobiega ładowaniu zbyt dużej ilości danych na raz.

### Widok: Weryfikacja propozycji AI

- **Ścieżka:** `/app/review-suggestions`
- **Główny cel:** Skoncentrowany proces weryfikacji (akceptacji/odrzucenia) fiszek wygenerowanych przez AI.
- **Kluczowe informacje:** Lista proponowanych par Pytanie/Odpowiedź.
- **Kluczowe komponenty:**
  - Lista komponentów `SuggestionCard`, każdy wyświetlający "Przód" i "Tył" propozycji.
  - Przyciski `Button` "Akceptuj" i "Odrzuć" na każdej karcie.
  - Wskaźnik postępu (np. "Weryfikacja 3 z 10").
  - Nawigacja aplikacji jest zablokowana na czas tego widoku.
- **UX, dostępność i względy bezpieczeństwa:** Tryb "focus mode" (zablokowana nawigacja) pomaga użytkownikowi skupić się na zadaniu. Interakcje są proste i binarne (akceptuj/odrzuć). Po weryfikacji ostatniej propozycji następuje automatyczne przekierowanie do listy fiszek.

### Widok: Sesja Nauki

- **Ścieżka:** `/app/study`
- **Główny cel:** Przeprowadzenie użytkownika przez sesję powtórek zgodnie z algorytmem Leitnera.
- **Kluczowe informacje:** Treść pojedynczej fiszki.
- **Kluczowe komponenty:**
  - `FlashcardDisplay`: Komponent wyświetlający jedną stronę fiszki ("Przód").
  - `Button` "Pokaż odpowiedź".
  - Po odkryciu odpowiedzi: przyciski `Button` "Wiedziałem" i `Button` "Nie wiedziałem".
  - `SessionSummary`: Karta podsumowująca po zakończeniu sesji (np. "Powtórzono X fiszek").
  - `EmptyState`: Komunikat, jeśli żadne fiszki nie wymagają powtórki danego dnia.
- **UX, dostępność i względy bezpieczeństwa:** Interfejs jest minimalistyczny, aby wspierać skupienie. Prezentowanie jednej fiszki na raz zapobiega przytłoczeniu. Jasne instrukcje i proste działania.

## 3. Mapa podróży użytkownika

Główny przepływ użytkownika koncentruje się na generowaniu i nauce fiszek.

1.  **Logowanie/Rejestracja:** Użytkownik trafia na stronę `/login` lub `/register`. Po pomyślnym uwierzytelnieniu jest przekierowywany do `/app/dashboard`.
2.  **Generowanie fiszek AI:**
    - Na **Dashboardzie**, użytkownik wkleja tekst do generatora AI i klika "Generuj".
    - Aplikacja wyświetla stan ładowania i po otrzymaniu odpowiedzi od API automatycznie przekierowuje na `/app/review-suggestions`.
3.  **Weryfikacja propozycji:**
    - W widoku **Weryfikacji propozycji AI**, użytkownik akceptuje lub odrzuca każdą sugestię. UI jest zablokowane, aby uniemożliwić nawigację.
    - Po ostatniej weryfikacji następuje automatyczne przekierowanie do `/app/flashcards`.
4.  **Przeglądanie i zarządzanie:**
    - Na liście fiszek (`/app/flashcards`) użytkownik widzi nowo dodane pozycje. Może je edytować (w oknie modalnym) lub usuwać (z potwierdzeniem).
5.  **Sesja Nauki:**
    - Użytkownik klika "Rozpocznij naukę" na **Dashboardzie** lub w nawigacji, przechodząc do `/app/study`.
    - Aplikacja prezentuje fiszki jedna po drugiej. Użytkownik ocenia swoją wiedzę.
    - Po przejrzeniu wszystkich zaplanowanych fiszek wyświetlane jest podsumowanie.

## 4. Układ i struktura nawigacji

Aplikacja wykorzystuje stały układ dla zalogowanych użytkowników, który otacza wszystkie widoki w strefie `/app/*`.

- **Layout (Układ):**

  - **Nagłówek (Header):** Zawiera logo aplikacji, główne linki nawigacyjne oraz menu użytkownika.
  - **Główna treść (Main Content):** Obszar, w którym renderowane są poszczególne widoki (Dashboard, Lista Fiszki, etc.).
  - **Stopka (Footer):** Zawiera linki do informacji o produkcie, polityki prywatności itp.

- **Nawigacja główna (w nagłówku):**

  - **Dashboard** (`/app/dashboard`)
  - **Moje Fiszki** (`/app/flashcards`)
  - **Nauka** (`/app/study`)

- **Menu użytkownika (rozwijane w nagłówku):**
  - Wyświetla adres e-mail zalogowanego użytkownika.
  - Przycisk **"Wyloguj"**.

Nawigacja jest zablokowana (wizualnie i funkcjonalnie) podczas przepływu weryfikacji propozycji AI, aby zapewnić pełne skupienie użytkownika na tym zadaniu.

## 5. Kluczowe komponenty

Poniżej znajduje się lista reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika.

- **`ConfirmationDialog`:** Modal używany do potwierdzania krytycznych akcji, takich jak usunięcie fiszki lub odrzucenie niezapisanych zmian w formularzu edycji. Zapewnia, że użytkownik nie podejmie nieodwracalnych działań przez pomyłkę.
- **`FlashcardsList`:** Responsywny komponent do wyświetlania listy fiszek. Na większych ekranach używa `Table` dla lepszej przejrzystości, a na urządzeniach mobilnych przełącza się na widok `Card`, aby zoptymalizować wykorzystanie przestrzeni.
- **`EditFlashcardModal`:** Okno modalne zawierające formularz do edycji istniejącej fiszki. Umożliwia edycję bez opuszczania widoku listy, co poprawia płynność pracy.
- **`EmptyState`:** Komponent wyświetlany, gdy lista danych jest pusta (np. brak fiszek, brak kart do powtórki). Informuje użytkownika o stanie i często sugeruje następny krok (np. "Stwórz swoją pierwszą fiszkę!").
- **`LoadingSkeletons`:** Zapewnia wizualną informację zwrotną, że dane są w trakcie ładowania. Poprawia postrzeganą wydajność, pokazując zarys interfejsu, zanim dane zostaną w pełni załadowane.
- **`Toast`:** Komponent do wyświetlania krótkich, nieblokujących powiadomień o sukcesie (np. "Fiszka została utworzona") lub błędach.

Użycie tych komponentów w całej aplikacji zapewni spójność, przewidywalność i wysoką jakość doświadczenia użytkownika.
