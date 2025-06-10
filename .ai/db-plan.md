# Architektura Bazy Danych PostgreSQL

Ten dokument opisuje schemat bazy danych PostgreSQL dla aplikacji Inteligentne Fiszki, zaprojektowany na podstawie dokumentu wymagań produktu (PRD) oraz notatek z sesji planowania.

## 1. Typy niestandardowe (ENUMs)

W celu zapewnienia spójności danych, zdefiniowano następujące typy wyliczeniowe:

```sql
CREATE TYPE flashcard_source AS ENUM ('ai', 'manual');
CREATE TYPE suggestion_status AS ENUM ('pending', 'accepted', 'rejected');
```

## 2. Lista Tabel

### Tabela: `flashcards`

Przechowuje wszystkie aktywne fiszki utworzone przez użytkowników.

| Nazwa Kolumny   | Typ Danych                 | Ograniczenia                                                                    | Opis                                                                 |
|-----------------|----------------------------|---------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `id`            | `uuid`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                      | Unikalny identyfikator fiszki.                                       |
| `user_id`       | `uuid`                     | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                       | Identyfikator użytkownika (właściciela) z tabeli `auth.users`.       |
| `front`         | `varchar(200)`             | `NOT NULL`                                                                      | Treść przedniej strony fiszki (pytanie).                             |
| `back`          | `varchar(500)`             | `NOT NULL`                                                                      | Treść tylnej strony fiszki (odpowiedź).                              |
| `source`        | `flashcard_source`         | `NOT NULL`                                                                      | Źródło pochodzenia fiszki (`ai` lub `manual`).                       |
| `leitner_box`   | `smallint`                 | `NOT NULL`, `DEFAULT 1`, `CHECK (leitner_box BETWEEN 1 AND 5)`                  | Numer "pudełka" w systemie Leitnera (1-5).                           |
| `next_review_at`| `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                                     | Data i czas następnej zaplanowanej powtórki.                         |
| `created_at`    | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                                     | Data i czas utworzenia rekordu.                                      |
| `updated_at`    | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                                     | Data i czas ostatniej modyfikacji rekordu.                           |
| -               | -                          | `UNIQUE (user_id, lower(front))`                                                | Zapobiega tworzeniu przez użytkownika duplikatów fiszek (bez względu na wielkość liter). |

### Tabela: `ai_suggestions`

Służy jako log wszystkich propozycji fiszek wygenerowanych przez AI w celu śledzenia metryk sukcesu.

| Nazwa Kolumny        | Typ Danych                 | Ograniczenia                                                                    | Opis                                                                  |
|----------------------|----------------------------|---------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `id`                 | `uuid`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                      | Unikalny identyfikator sugestii.                                      |
| `user_id`            | `uuid`                     | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                       | Identyfikator użytkownika, dla którego wygenerowano sugestię.         |
| `batch_id`           | `uuid`                     | `NOT NULL`                                                                      | Identyfikator grupy, pozwalający połączyć sugestie z jednego żądania. |
| `source_text_hash`   | `varchar(64)`              | `NOT NULL`                                                                      | Skrót (SHA-256) oryginalnego tekstu źródłowego.                       |
| `front_suggestion`   | `varchar(200)`             | `NOT NULL`                                                                      | Zasugerowana treść przedniej strony fiszki.                           |
| `back_suggestion`    | `varchar(500)`             | `NOT NULL`                                                                      | Zasugerowana treść tylnej strony fiszki.                              |
| `status`             | `suggestion_status`        | `NOT NULL`, `DEFAULT 'pending'`                                                 | Status weryfikacji sugestii przez użytkownika.                        |
| `created_at`         | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                                     | Data i czas utworzenia sugestii.                                      |

## 3. Relacje Między Tabelami

-   **`auth.users` 1 : N `flashcards`**: Jeden użytkownik może mieć wiele fiszek. Relacja zdefiniowana przez klucz obcy `flashcards.user_id`. Usunięcie użytkownika kaskadowo usuwa wszystkie jego fiszki.
-   **`auth.users` 1 : N `ai_suggestions`**: Jeden użytkownik może mieć wiele sugestii AI. Relacja zdefiniowana przez klucz obcy `ai_suggestions.user_id`. Usunięcie użytkownika kaskadowo usuwa wszystkie jego sugestie.

## 4. Indeksy

W celu optymalizacji wydajności zapytań, zostaną utworzone następujące indeksy:

1.  **Indeks do sesji nauki**: Usprawnia pobieranie fiszek do powtórki dla danego użytkownika.
    ```sql
    CREATE INDEX idx_flashcards_user_next_review ON flashcards (user_id, next_review_at);
    ```
2.  **Indeks do weryfikacji sugestii AI**: Usprawnia wyszukiwanie sugestii oczekujących na weryfikację przez użytkownika.
    ```sql
    CREATE INDEX idx_ai_suggestions_user_status ON ai_suggestions (user_id, status);
    ```
3.  **Indeks dla zadania czyszczącego (TTL)**: Wspomaga okresowe usuwanie starych, niezweryfikowanych sugestii.
    ```sql
    CREATE INDEX idx_ai_suggestions_created_at ON ai_suggestions (created_at);
    ```

## 5. Zasady Bezpieczeństwa (Row-Level Security)

W celu zapewnienia, że użytkownicy mają dostęp wyłącznie do swoich danych, dla tabel `flashcards` i `ai_suggestions` zostaną wdrożone polityki RLS.

### Tabela `flashcards`

```sql
-- 1. Włącz RLS dla tabeli
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- 2. Zezwól użytkownikom na odczyt własnych fiszek
CREATE POLICY "Allow users to read their own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- 3. Zezwól użytkownikom na tworzenie fiszek we własnym imieniu
CREATE POLICY "Allow users to create their own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Zezwól użytkownikom na modyfikację własnych fiszek
CREATE POLICY "Allow users to update their own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Zezwól użytkownikom na usuwanie własnych fiszek
CREATE POLICY "Allow users to delete their own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);
```

### Tabela `ai_suggestions`

```sql
-- 1. Włącz RLS dla tabeli
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- 2. Zezwól użytkownikom na odczyt własnych sugestii
CREATE POLICY "Allow users to read their own suggestions"
ON ai_suggestions FOR SELECT
USING (auth.uid() = user_id);

-- 3. Zezwól na tworzenie sugestii (proces backendowy)
-- Zakładając, że operacje zapisu będą wykonywane z użyciem klucza service_role,
-- który omija RLS. Jeśli nie, polityka INSERT musiałaby zostać odpowiednio dostosowana.
CREATE POLICY "Allow backend to create suggestions"
ON ai_suggestions FOR INSERT
WITH CHECK (true); -- Lub bardziej restrykcyjna polityka w zależności od implementacji

-- 4. Zezwól użytkownikom na modyfikację (akceptację/odrzucenie) własnych sugestii
CREATE POLICY "Allow users to update their own suggestions"
ON ai_suggestions FOR UPDATE
USING (auth.uid() = user_id);
```

## 6. Dodatkowe Uwagi i Decyzje Projektowe

1.  **Automatyczna aktualizacja `updated_at`**: Zaleca się utworzenie funkcji i triggera w bazie danych, które automatycznie będą aktualizować kolumnę `updated_at` w tabeli `flashcards` przy każdej modyfikacji wiersza.
    ```sql
    CREATE OR REPLACE FUNCTION handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER on_flashcards_update
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();
    ```
2.  **Czyszczenie starych sugestii (TTL)**: Niezweryfikowane sugestie (`status = 'pending'`) będą automatycznie usuwane po 30 dniach. Zadanie to będzie realizowane przez mechanizm cron (np. `pg_cron` w Supabase) uruchamiany raz dziennie.
    ```sql
    -- Przykładowe zapytanie dla zadania cron
    DELETE FROM ai_suggestions WHERE status = 'pending' AND created_at < now() - interval '30 days';
    ```
3.  **Postępowanie z sugestiami**: Po akceptacji sugestii przez użytkownika i utworzeniu na jej podstawie fiszki, wpis w tabeli `ai_suggestions` będzie miał zaktualizowany `status` na `'accepted'`. Nie będzie on usuwany, aby zachować pełne dane do analizy metryk sukcesu.
4.  **Źródło danych o użytkownikach**: Schemat celowo nie replikuje danych użytkowników (takich jak e-mail). Wykorzystuje wbudowaną w Supabase tabelę `auth.users` jako jedyne źródło prawdy. Dane te mogą być pobierane w aplikacji za pomocą `JOIN`.
5.  **System Leitnera**: Logika interwałów powtórek (1, 3, 7, 14, 30 dni) oraz aktualizacja `leitner_box` i `next_review_at` będzie zaimplementowana w warstwie aplikacyjnej, co zapewnia większą elastyczność w modyfikacji algorytmu w przyszłości. 