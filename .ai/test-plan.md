# Plan Testów dla Aplikacji "Inteligentne Fiszki"

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji webowej "Inteligentne Fiszki". Aplikacja ma na celu zautomatyzowanie procesu tworzenia fiszek edukacyjnych przy użyciu sztucznej inteligencji, aby ułatwić i przyspieszyć naukę metodą powtórek interwałowych (spaced repetition).

Plan ten obejmuje strategię, zakres, zasoby i harmonogram działań związanych z testowaniem, mających na celu zapewnienie wysokiej jakości, niezawodności i zgodności aplikacji z wymaganiami.

### 1.2. Cele testowania

Główne cele procesu testowania to:

- **Weryfikacja funkcjonalności:** Upewnienie się, że wszystkie kluczowe funkcje aplikacji, takie jak generowanie fiszek przez AI, zarządzanie kontem użytkownika i obsługa fiszek, działają zgodnie ze specyfikacją.
- **Zapewnienie jakości:** Identyfikacja i eliminacja błędów przed wdrożeniem produkcyjnym.
- **Ocena użyteczności:** Sprawdzenie, czy interfejs użytkownika jest intuicyjny i przyjazny dla użytkownika końcowego.
- **Walidacja integracji:** Potwierdzenie, że integracja z usługami zewnętrznymi (Supabase, OpenRouter AI) działa poprawnie i jest odporna na błędy.
- **Zapewnienie bezpieczeństwa:** Weryfikacja podstawowych aspektów bezpieczeństwa, w szczególności autoryzacji i ochrony danych użytkownika.
- **Ocena wydajności:** Upewnienie się, że aplikacja działa responsywnie, a czas generowania fiszek jest akceptowalny.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- **Moduł Uwierzytelniania:**
  - Rejestracja nowego użytkownika.
  - Logowanie i wylogowywanie.
  - Ochrona tras (middleware).
  - Obsługa błędów (np. nieprawidłowe dane logowania, istniejący użytkownik).
- **Generator Fiszki AI:**
  - Generowanie sugestii fiszek na podstawie wprowadzonego tekstu.
  - Obsługa różnych długości i formatów tekstu wejściowego.
  - Obsługa błędów API (np. brak odpowiedzi, błędy 5xx).
- **Zarządzanie Sugestiami:**
  - Przeglądanie wygenerowanych sugestii.
  - Akceptacja lub odrzucenie pojedynczej sugestii.
  - Edycja treści sugestii przed zapisaniem.
- **Zarządzanie Fiszkami:**
  - Ręczne tworzenie nowej fiszki.
  - Przeglądanie, edycja i usuwanie istniejących fiszek.
  - Wyświetlanie listy fiszek na pulpicie użytkownika.
- **Interfejs Użytkownika:**
  - Poprawność wyświetlania na różnych urządzeniach (responsywność).
  - Działanie komponentów UI (przyciski, formularze, karty).

### 2.2. Funkcjonalności wyłączone z testów

- Testowanie wewnętrznej logiki komponentów `shadcn/ui` (skupiamy się na integracji).
- Testowanie wewnętrznego działania algorytmu AI dostarczanego przez OpenRouter (skupiamy się na kontrakcie API i obsłudze odpowiedzi).
- Zaawansowane testy penetracyjne i bezpieczeństwa (poza podstawową weryfikacją autoryzacji).
- Testowanie działania samej bazy danych Supabase (skupiamy się na poprawności zapytań i polityk RLS).

## 3. Typy testów do przeprowadzenia

W celu zapewnienia kompleksowego pokrycia, zostaną przeprowadzone następujące typy testów:

- **Testy jednostkowe (Unit Tests):**
  - Cel: Weryfikacja małych, izolowanych fragmentów kodu (funkcje, hooki, serwisy).
  - Zakres: Głównie logika biznesowa w `src/lib/services`, logika store'ów Zustand w `src/lib/stores` oraz funkcje pomocnicze w `src/lib/utils.ts`.
  - Narzędzia: Vitest, React Testing Library (dla hooków).
- **Testy komponentów (Component Tests):**
  - Cel: Testowanie pojedynczych komponentów React i Astro w izolacji.
  - Zakres: Komponenty w `src/components/`, w szczególności te z logiką i interakcjami (`AiGeneratorForm.tsx`, `LoginForm.tsx`, `SuggestionReviewer.tsx`).
  - Narzędzia: Vitest, React Testing Library / Astro Testing Library.
- **Testy integracyjne (Integration Tests):**
  - Cel: Weryfikacja współpracy między różnymi częściami systemu.
  - Zakres:
    - Integracja frontend-backend: testowanie endpointów API (`src/pages/api/`) od strony klienta.
    - Integracja z bazą danych: testowanie logiki w `src/db` i serwisów z nią powiązanych przeciwko testowej bazie danych Supabase.
    - Testowanie middleware (`src/middleware/index.ts`).
  - Narzędzia: Vitest (dla API), Playwright (dla testów na żywym środowisku).
- **Testy End-to-End (E2E):**
  - Cel: Symulacja pełnych scenariuszy użytkownika w przeglądarce.
  - Zakres: Kluczowe przepływy użytkownika, np. "Rejestracja -> Logowanie -> Wygenerowanie fiszek -> Przejrzenie sugestii -> Zapisanie fiszki -> Wylogowanie".
  - Narzędzia: Playwright.
- **Testy regresji wizualnej (Visual Regression Testing):**
  - Cel: Wykrywanie niezamierzonych zmian w interfejsie użytkownika.
  - Zakres: Kluczowe widoki i komponenty.
  - Narzędzia: (Opcjonalnie) Chromatic lub Percy.
- **Testy statycznej analizy kodu (Static Analysis):**
  - Cel: Wykrywanie błędów na etapie pisania kodu.
  - Zakres: Cały kod projektu.
  - Narzędzia: TypeScript (`tsc --noEmit`), ESLint, Prettier.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### Scenariusz 1: Rejestracja i logowanie użytkownika

1.  Użytkownik wchodzi na stronę `/register`.
2.  Wypełnia formularz rejestracji poprawnymi danymi.
3.  Po pomyślnej rejestracji zostaje przekierowany na stronę `/login`.
4.  Wprowadza dane logowania i zostaje przekierowany na pulpit (`/app/dashboard`).
5.  Próba wejścia na `/app/dashboard` bez logowania przekierowuje na `/login`.
6.  Próba rejestracji z istniejącym adresem e-mail wyświetla błąd.

### Scenariusz 2: Generowanie i przeglądanie fiszek AI

1.  Zalogowany użytkownik przechodzi na stronę `/generate`.
2.  Wkleja tekst do pola `textarea` w `AiGeneratorForm`.
3.  Klika przycisk "Generuj".
4.  Aplikacja wyświetla stan ładowania.
5.  Po chwili użytkownik zostaje przekierowany na `/app/review-suggestions`.
6.  Na stronie wyświetlane są wygenerowane sugestie fiszek (`SuggestionCard`).
7.  Użytkownik może edytować, zatwierdzić lub odrzucić każdą sugestię.
8.  Zatwierdzone fiszki pojawiają się na pulpicie (`/app/dashboard`).

### Scenariusz 3: Ręczne zarządzanie fiszkami

1.  Zalogowany użytkownik na pulpicie klika "Dodaj fiszkę".
2.  Wypełnia formularz z awersem i rewersem.
3.  Nowa fiszka pojawia się na liście.
4.  Użytkownik może edytować istniejącą fiszkę.
5.  Użytkownik może usunąć istniejącą fiszkę, co jest poprzedzone potwierdzeniem.

## 5. Środowisko testowe

- **Środowisko lokalne:** Programiści uruchamiają testy jednostkowe i komponentów lokalnie przed wypchnięciem zmian do repozytorium.
- **Środowisko CI/CD (np. GitHub Actions):**
  - Testy statyczne, jednostkowe i komponentów uruchamiane na każdym pushu do gałęzi.
  - Testy E2E i integracyjne uruchamiane na każdym pull requeście do gałęzi `main`.
- **Środowisko testowe (Staging):**
  - Oddzielna instancja aplikacji połączona z dedykowaną, testową instancją Supabase.
  - Na tym środowisku przeprowadzane są manualne testy akceptacyjne oraz automatyczne testy E2E.
  - Baza danych na środowisku stagingowym jest regularnie czyszczona i wypełniana danymi testowymi.

## 6. Narzędzia do testowania

| Typ testu           | Narzędzie                                    | Konfiguracja                                    |
| ------------------- | -------------------------------------------- | ----------------------------------------------- |
| Testy jednostkowe   | Vitest                                       | `vitest.config.ts`                              |
| Testy komponentów   | React Testing Library, Astro Testing Library | Zintegrowane z Vitest                           |
| Testy E2E           | Playwright                                   | `playwright.config.ts`                          |
| Statyczna analiza   | ESLint, Prettier, TypeScript                 | `.eslintrc.cjs`, `.prettierrc`, `tsconfig.json` |
| Mockowanie API      | `msw` (Mock Service Worker)                  | Do izolowania frontendu od backendu w testach   |
| Zarządzanie kodem   | Git, GitHub                                  |                                                 |
| Automatyzacja CI/CD | GitHub Actions                               | `.github/workflows/`                            |

## 7. Harmonogram testów

Testowanie jest procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania.

- **Sprint 0:** Konfiguracja narzędzi testowych, CI/CD i środowiska testowego.
- **Podczas sprintów deweloperskich:**
  - Programiści piszą testy jednostkowe i komponentów dla nowo tworzonych funkcjonalności.
  - Inżynier QA (lub wyznaczona osoba) tworzy scenariusze testów E2E dla ukończonych historyjek użytkownika.
- **Przed każdym wdrożeniem:**
  - Pełna regresja automatyczna (jednostkowe, integracyjne, E2E) jest uruchamiana na środowisku CI.
  - Manualne testy akceptacyjne dla kluczowych scenariuszy na środowisku stagingowym.

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia (rozpoczęcia testów)

- Kod został zintegrowany z główną gałęzią deweloperską.
- Aplikacja została pomyślnie zbudowana i wdrożona na środowisku testowym.
- Wszystkie testy jednostkowe i komponentów przechodzą pomyślnie.

### 8.2. Kryteria wyjścia (zakończenia testów i wdrożenia)

- 100% testów automatycznych (jednostkowych, integracyjnych, E2E) przechodzi pomyślnie.
- Pokrycie kodu testami jednostkowymi utrzymuje się powyżej 80% dla kluczowych modułów (`src/lib`, `src/pages/api`).
- Nie istnieją żadne otwarte błędy o priorytecie krytycznym (blocker) lub wysokim.
- Wszystkie scenariusze testów akceptacyjnych zostały wykonane i zakończone sukcesem.

## 9. Role i odpowiedzialności

- **Programiści:**
  - Pisanie testów jednostkowych i komponentów.
  - Utrzymywanie i naprawa testów.
  - Uruchamianie testów lokalnie przed commitem.
  - Naprawa błędów zgłoszonych w procesie testowym.
- **Inżynier QA / Tester (jeśli dotyczy):**
  - Projektowanie i utrzymywanie scenariuszy testów E2E.
  - Przeprowadzanie manualnych testów akceptacyjnych.
  - Analiza wyników testów automatycznych.
  - Raportowanie i zarządzanie cyklem życia błędów.
- **Tech Lead / Architekt:**
  - Nadzór nad strategią i architekturą testów.
  - Dbanie o jakość kodu i standardy testowania.
  - Podejmowanie decyzji o wdrożeniu na podstawie wyników testów.

## 10. Procedury raportowania błędów

Wszystkie znalezione błędy będą raportowane w systemie do śledzenia zadań (np. GitHub Issues). Każdy raport powinien zawierać:

- **Tytuł:** Zwięzły opis problemu.
- **Środowisko:** Gdzie błąd wystąpił (np. przeglądarka, system operacyjny, środowisko testowe).
- **Kroki do odtworzenia:** Dokładna, ponumerowana lista kroków potrzebna do zreprodukowania błędu.
- **Oczekiwany rezultat:** Co powinno się wydarzyć.
- **Rzeczywisty rezultat:** Co się faktycznie wydarzyło.
- **Priorytet:** Krytyczny, Wysoki, Średni, Niski.
- **Załączniki:** Zrzuty ekranu, nagrania wideo, logi konsoli.
