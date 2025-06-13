# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu autentykacji (rejestracja, logowanie, wylogowanie) dla aplikacji "Inteligentne Fiszki". Specyfikacja bazuje na wymaganiach produktu (PRD), planie UI, architekturze bazy danych oraz zdefiniowanym stosie technologicznym, z kluczowym wykorzystaniem **Supabase Auth** jako dostawcy usługi uwierzytelniania i **Astro** jako frameworka aplikacyjnego.

## 2. Architektura Interfejsu Użytkownika

Architektura UI dzieli się na strefę publiczną (dostępną bez logowania) i prywatną (chronioną, dla zalogowanych użytkowników).

### 2.1. Strony i Layouty (Astro)

- **`src/pages/login.astro`**

  - **Cel:** Wyświetlenie formularza logowania.
  - **Typ:** Strona publiczna, renderowana po stronie serwera (SSR).
  - **Layout:** `src/layouts/PublicLayout.astro`.
  - **Zawartość:** Będzie renderować interaktywny komponent `LoginForm.tsx`.
  - **Logika serwerowa:** Przed renderowaniem sprawdzi, czy użytkownik nie jest już zalogowany (na podstawie sesji z middleware). Jeśli tak, przekieruje go do `/app/dashboard`.

- **`src/pages/register.astro`**

  - **Cel:** Wyświetlenie formularza rejestracji.
  - **Typ:** Strona publiczna, renderowana po stronie serwera (SSR).
  - **Layout:** `src/layouts/PublicLayout.astro`.
  - **Zawartość:** Będzie renderować interaktywny komponent `RegisterForm.tsx`.
  - **Logika serwerowa:** Analogicznie do strony logowania, przekieruje zalogowanego użytkownika do pulpitu.

- **`src/layouts/PublicLayout.astro` (Nowy)**

  - **Cel:** Minimalistyczny layout dla stron publicznych (`/login`, `/register`).
  - **Opis:** Będzie zawierał podstawową strukturę HTML (`<head>`, `<body>`), załączone globalne style (Tailwind), ale bez elementów nawigacyjnych aplikacji (nagłówek, menu użytkownika). Wyświetli komponenty `<slot />` w wyśrodkowanym kontenerze.

- **`src/layouts/AppLayout.astro` (Aktualizacja)**
  - **Cel:** Główny layout dla strefy prywatnej `/app/*`.
  - **Opis:** Zostanie zaktualizowany o logikę renderowania komponentu `UserNav.tsx` w nagłówku. Dostęp do danych użytkownika (np. e-mail) uzyska z `Astro.locals.session`, które zostanie dostarczone przez middleware.

### 2.2. Komponenty Interaktywne (React)

Komponenty te będą odpowiedzialne za całą logikę po stronie klienta, w tym zarządzanie stanem formularza, walidację i komunikację z Supabase.

- **`src/components/auth/LoginForm.tsx` (Nowy)**

  - **Framework:** React (`client:load`).
  - **UI:** Zbudowany z komponentów `Card`, `CardHeader`, `CardContent`, `Input`, `Label`, `Button` z biblioteki `shadcn/ui`.
  - **Zarządzanie stanem:** `useState` do przechowywania wartości pól (e-mail, hasło), stanu ładowania i komunikatów o błędach.
  - **Walidacja:** Użycie biblioteki `Zod` do walidacji po stronie klienta (format e-mail, niepuste hasło) przed wysłaniem żądania.
  - **Logika:**
    1.  Po kliknięciu "Zaloguj", komponent wysyła żądanie `POST` do endpointu `/api/auth/login` z adresem e-mail i hasłem w ciele żądania.
    2.  W przypadku sukcesu, serwer ustawia sesję w cookies, a komponent przekierowuje użytkownika do `/app/dashboard` za pomocą `window.location.href`.
    3.  W przypadku błędu (np. błędne dane), odpowiedź z API jest przechwytywana, a komunikat o błędzie jest wyświetlany pod formularzem.

- **`src/components/auth/RegisterForm.tsx` (Nowy)**

  - **Framework:** React (`client:load`).
  - **UI:** Analogiczny do `LoginForm.tsx`.
  - **Walidacja:** Użycie `Zod` do walidacji (format e-mail, wymagania co do siły hasła).
  - **Logika:**
    1.  Po kliknięciu "Zarejestruj", komponent wysyła żądanie `POST` do endpointu `/api/auth/register` z adresem e-mail i hasłem. Supabase, wywołany po stronie serwera, automatycznie hashuje hasło, realizując kryterium US-001.
    2.  Zgodnie z wymaganiem US-001, po pomyślnej rejestracji użytkownik jest automatycznie zalogowany (serwer tworzy sesję).
    3.  Następuje przekierowanie do `/app/dashboard`.
    4.  W przypadku błędu (np. użytkownik już istnieje), stosowny komunikat jest wyświetlany w interfejsie.

- **`src/components/auth/UserNav.tsx` (Nowy)**
  - **Framework:** React (`client:load`).
  - **UI:** Komponent `DropdownMenu` z `shadcn/ui`, umieszczony w nagłówku `AppLayout.astro`.
  - **Zawartość:** Będzie wyświetlał e-mail zalogowanego użytkownika i opcję "Wyloguj".
  - **Logika:**
    1.  Kliknięcie przycisku "Wyloguj" wywołuje `supabase.auth.signOut()`.
    2.  Supabase SDK usuwa sesję z cookies.
    3.  Komponent przekierowuje użytkownika do `/login` (zgodnie z architekturą UI, po wylogowaniu użytkownik zawsze trafia na stronę logowania, ponieważ nie istnieje osobna strona główna dla niezalogowanych).
    4.  Dla spójności z procesami logowania i rejestracji, kliknięcie "Wyloguj" powinno wysłać żądanie `POST` do endpointu `/api/auth/logout`.
    5.  Endpoint serwerowy wywołuje `supabase.auth.signOut()`, co usuwa sesję z cookies.
    6.  Komponent, po otrzymaniu pomyślnej odpowiedzi, przekierowuje użytkownika do `/login`.

### 2.3. Walidacja i Obsługa Błędów

- **Walidacja po stronie klienta (Zod):** Zapewni natychmiastową informację zwrotną dla użytkownika, redukując liczbę niepotrzebnych zapytań do API. Schematy walidacji będą zdefiniowane w oddzielnym pliku (np. `src/lib/validators.ts`) i importowane do komponentów React.
- **Komunikaty o błędach:** Błędy zwrócone przez Supabase API (np. "Invalid login credentials", "User already registered") będą przechwytywane w blokach `try...catch` wewnątrz komponentów i wyświetlane w sposób zrozumiały dla użytkownika, np. przy użyciu komponentu `Toast` lub jako tekst pod odpowiednim polem formularza.
- **Komunikaty o błędach:** Błędy zwrócone przez własne API (np. z endpointów `/api/auth/login`) będą przechwytywane w blokach `try...catch` wewnątrz komponentów i wyświetlane w sposób zrozumiały dla użytkownika, np. przy użyciu komponentu `Toast` lub jako tekst pod odpowiednim polem formularza.

## 3. Logika Backendowa (Astro i Supabase)

Dzięki architekturze BaaS (Backend-as-a-Service) Supabase, nie ma potrzeby tworzenia dedykowanych endpointów API dla rejestracji i logowania. Kluczową rolę po stronie serwera odgrywa middleware.

### 3.1. Middleware (`src/middleware/index.ts`)

- **Cel:** Ochrona tras prywatnych, zarządzanie sesją po stronie serwera i udostępnianie kontekstu autentykacji do stron Astro.
- **Działanie:** Middleware będzie uruchamiane dla każdego żądania do serwera.
- **Kluczowe kroki:**
  1.  Na początku middleware tworzy instancję klienta Supabase po stronie serwera (`createServerClient`), przekazując do niego `cookies` z przychodzącego żądania.
  2.  Pobiera aktualną sesję użytkownika za pomocą `supabase.auth.getSession()`.
  3.  Udostępnia sesję i klienta Supabase dla wszystkich stron i endpointów API poprzez kontekst Astro: `Astro.locals.session = session` i `Astro.locals.supabase = supabase`.
  4.  Implementuje logikę routingu:
      - Jeśli żądanie dotyczy trasy prywatnej (`/app/*`) a `Astro.locals.session` jest `null`, następuje przekierowanie (`Astro.redirect`) do `/login`.
      - Jeśli żądanie dotyczy `/login` lub `/register`, a użytkownik _jest_ zalogowany (`Astro.locals.session` istnieje), następuje przekierowanie do `/app/dashboard`.
  5.  Zwraca odpowiedź (`next()`), która na końcu cyklu życia żądania zaktualizuje `cookies` sesji w przeglądarce użytkownika.

### 3.2. Renderowanie po stronie serwera

Dzięki `Astro.locals`, każda strona `.astro` renderowana na serwerze będzie miała dostęp do informacji o sesji. Umożliwi to warunkowe renderowanie elementów interfejsu (np. `UserNav` w `AppLayout.astro`) oraz pobieranie danych specyficznych dla zalogowanego użytkownika bezpośrednio na serwerze, co jest zgodne z politykami RLS zdefiniowanymi w `db-plan.md`.

Chociaż Supabase umożliwia bezpośrednią komunikację z klientem, w celu większej kontroli i hermetyzacji logiki, procesy autentykacji (logowanie, rejestracja, wylogowanie) zostaną zaimplementowane jako dedykowane endpointy API w Astro. Kluczową rolę po stronie serwera, oprócz endpointów, odgrywa również middleware.

### 3.1. Endpointy API (`src/pages/api/auth/*`)

- **Cel:** Hermetyzacja logiki autentykacji po stronie serwera, zapewniając pojedynczy punkt odpowiedzialności za interakcje z Supabase Auth.
- **`POST /api/auth/register`**
  - Odbiera `email` i `password` z ciała żądania.
  - Waliduje dane wejściowe (np. przy użyciu Zod).
  - Wywołuje `supabase.auth.signUp()` z danymi użytkownika.
  - W przypadku błędu (np. użytkownik istnieje) zwraca status 400 z komunikatem błędu.
  - W przypadku sukcesu zwraca status 200. Sesja jest automatycznie tworzona przez Supabase SSR.
- **`POST /api/auth/login`**
  - Odbiera `email` i `password`.
  - Wywołuje `supabase.auth.signInWithPassword()`.
  - W przypadku błędu (nieprawidłowe dane) zwraca status 401 z komunikatem.
  - W przypadku sukcesu zwraca status 200.
- **`POST /api/auth/logout`**
  - Wywołuje `supabase.auth.signOut()`.
  - W przypadku błędu zwraca odpowiedni status.
  - W przypadku sukcesu zwraca status 200.

### 3.2. Middleware (`src/middleware/index.ts`)

- **Cel:** Ochrona tras prywatnych, zarządzanie sesją po stronie serwera i udostępnianie kontekstu autentykacji do stron Astro.
- **Działanie:** Middleware będzie uruchamiane dla każdego żądania do serwera.
- **Kluczowe kroki:**
  1.  Na początku middleware tworzy instancję klienta Supabase po stronie serwera (`createServerClient`), przekazując do niego `cookies` z przychodzącego żądania.
  2.  Pobiera aktualną sesję użytkownika za pomocą `supabase.auth.getSession()`.
  3.  Udostępnia sesję i klienta Supabase dla wszystkich stron i endpointów API poprzez kontekst Astro: `Astro.locals.session = session` i `Astro.locals.supabase = supabase`.
  4.  Implementuje logikę routingu:
      - Jeśli żądanie dotyczy trasy prywatnej (`/app/*`) a `Astro.locals.session` jest `null`, następuje przekierowanie (`Astro.redirect`) do `/login`.
      - Jeśli żądanie dotyczy `/login` lub `/register`, a użytkownik _jest_ zalogowany (`Astro.locals.session` istnieje), następuje przekierowanie do `/app/dashboard`.
  5.  Zwraca odpowiedź (`next()`), która na końcu cyklu życia żądania zaktualizuje `cookies` sesji w przeglądarce użytkownika.

### 3.3. Renderowanie po stronie serwera

Dzięki `Astro.locals`, każda strona `.astro` renderowana na serwerze będzie miała dostęp do informacji o sesji. Umożliwi to warunkowe renderowanie elementów interfejsu (np. `UserNav` w `AppLayout.astro`) oraz pobieranie danych specyficznych dla zalogowanego użytkownika bezpośrednio na serwerze, co jest zgodne z politykami RLS zdefiniowanymi w `db-plan.md`.

## 4. System Autentykacji (Integracja z Supabase Auth)

### 4.1. Konfiguracja Klientów Supabase

Kluczowe jest rozdzielenie klientów Supabase na klienckiego i serwerowego.

- **Klient przeglądarki (`src/lib/supabase/client.ts`)**

  - **Funkcja:** `createBrowserClient()` z `@supabase/ssr`.
  - **Użycie:** Importowany i używany wyłącznie w komponentach React (`.tsx`) do interakcji z API Supabase po stronie klienta (logowanie, rejestracja, wylogowanie).

- **Klient serwerowy (`src/middleware/index.ts`)**
  - **Funkcja:** `createServerClient()` z `@supabase/ssr`.
  - **Użycie:** Tworzony w middleware dla każdego żądania. Służy do weryfikacji sesji i bezpiecznego dostępu do danych na serwerze (wewnątrz stron `.astro` i endpointów API).

### 4.2. Przepływ Danych i Sesji (end-to-end)

1.  **Rejestracja/Logowanie:** Użytkownik wchodzi w interakcję z komponentem React (`LoginForm` / `RegisterForm`). Komponent wysyła żądanie `POST` do odpowiedniego **endpointu API w Astro** (`/api/auth/login` lub `/api/auth/register`).
2.  **Logika serwerowa:** Endpoint API po stronie serwera odbiera żądanie. Tworzy instancję **klienta serwerowego Supabase**, waliduje dane i wywołuje odpowiednią metodę Supabase Auth (`signUp` lub `signInWithPassword`).
3.  **Zarządzanie Cookie:** Biblioteka `@supabase/ssr`, w odpowiedzi na wywołanie serwerowe, automatycznie i bezpiecznie zarządza `cookies` sesji w przeglądarce.
4.  **Nawigacja:** Komponent React, po otrzymaniu pomyślnej odpowiedzi (status 200) z API, programowo przekierowuje użytkownika na chronioną stronę, np. `/app/dashboard`.
5.  **Weryfikacja na serwerze:** Żądanie GET dla `/app/dashboard` jest przechwytywane przez **middleware Astro**.
6.  **Middleware w akcji:** Middleware używa **klienta serwerowego** i `cookies` z żądania, aby zweryfikować sesję. Stwierdza, że użytkownik jest zalogowany i pozwala na kontynuowanie żądania.
7.  **Renderowanie strony:** Strona `/app/dashboard.astro` jest renderowana na serwerze. Ma dostęp do `Astro.locals.session` i może wyświetlać spersonalizowane treści.
8.  **Wylogowanie:** Użytkownik klika "Wyloguj". Komponent React (`UserNav`) wysyła żądanie `POST` do endpointu `/api/auth/logout`. Endpoint wywołuje `supabase.auth.signOut()`. Sesja w `cookies` jest usuwana, a komponent przekierowuje na `/login`.

Ta architektura zapewnia płynne i bezpieczne doświadczenie użytkownika, łącząc interaktywność React z bezpieczeństwem i wydajnością logiki po stronie serwera w Astro. Jest w pełni zgodna z dostarczoną dokumentacją i wykorzystuje najlepsze praktyki integracji z Supabase.
