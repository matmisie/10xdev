# Dokument wymagań produktu (PRD) - Inteligentne Fiszki

## 1. Przegląd produktu

Inteligentne Fiszki to aplikacja internetowa zaprojektowana, aby pomóc studentom, zwłaszcza na kierunkach związanych z AI i ML, w efektywnym tworzeniu materiałów do nauki. Aplikacja rozwiązuje problem czasochłonnego, ręcznego przygotowywania fiszek, wykorzystując sztuczną inteligencję do automatycznego generowania par Pytanie/Odpowiedź z dostarczonych przez użytkownika notatek tekstowych. MVP (Minimum Viable Product) koncentruje się na podstawowej funkcjonalności: generowaniu fiszek przez AI, ręcznym ich tworzeniu, zarządzaniu nimi oraz nauce z wykorzystaniem sprawdzonego algorytmu powtórek Leitnera. Celem jest dostarczenie narzędzia, które oszczędza czas i promuje regularne powtórki materiału, co jest kluczem do trwałego zapamiętywania.

## 2. Problem użytkownika

Głównym problemem, na który odpowiada produkt, jest fakt, że manualne tworzenie wysokiej jakości fiszek edukacyjnych jest procesem powolnym i żmudnym. Studenci, dysponujący obszernymi notatkami z wykładów, często rezygnują z tej formy nauki z powodu bariery czasowej. Zniechęca ich to do korzystania z metody regularnych powtórek (spaced repetition), która jest jedną z najskuteczniejszych technik uczenia się. Nasza aplikacja jest skierowana do studentów kierunków technicznych, którzy potrzebują szybkiego i prostego sposobu na przekształcenie swoich cyfrowych notatek w gotowe do nauki fiszki, minimalizując wysiłek i maksymalizując efektywność nauki.

## 3. Wymagania funkcjonalne

- FR-001: System kont użytkowników: Aplikacja musi zapewnić podstawową obsługę kont, w tym możliwość rejestracji nowego użytkownika i logowania dla użytkowników powracających.
- FR-002: Generator fiszek AI: Użytkownik musi mieć możliwość wklejenia tekstu (np. notatek z wykładu) do pola tekstowego, na podstawie którego system, przy użyciu zewnętrznego API LLM, wygeneruje propozycje fiszek w formacie Przód/Tył. Każda propozycja musi być przedstawiona do akceptacji lub odrzucenia.
- FR-003: Ręczne tworzenie fiszek: Aplikacja musi udostępniać prosty formularz pozwalający użytkownikowi na manualne dodanie nowej fiszki, składającej się ze strony przedniej (pytanie) i tylnej (odpowiedź).
- FR-004: System nauki (Algorytm Leitnera): Aplikacja musi zaimplementować system nauki oparty na algorytmie Leitnera. System powinien prezentować użytkownikowi fiszki do powtórki w odpowiednich interwałach czasowych, a na podstawie oceny użytkownika (znał odpowiedź / nie znał), przesuwać fiszkę do odpowiedniego "pudełka" w systemie.
- FR-005: Zarządzanie fiszkami: Użytkownik musi mieć możliwość przeglądania wszystkich swoich fiszek, edytowania ich treści oraz trwałego usuwania z bazy danych. Dostęp do fiszek musi być ograniczony wyłącznie do ich właściciela.

## 4. Granice produktu

W ramach MVP, projekt ma jasno określone granice, aby zapewnić realizację w wyznaczonym terminie (10 dni). Poniższe funkcje i cechy celowo NIE wchodzą w zakres tej wersji produktu:

- Zaawansowane algorytmy powtórek: Nie będzie implementowany żaden autorski ani skomplikowany algorytm w stylu SuperMemo czy Anki. Ograniczamy się do prostej implementacji systemu Leitnera.
- Import złożonych formatów: Aplikacja nie będzie obsługiwać importu plików takich jak PDF, DOCX, Markdown itp. Jedyną metodą wprowadzania danych do generatora AI jest kopiuj-wklej.
- Funkcje społecznościowe: Nie będzie możliwości współdzielenia talii fiszek między użytkownikami, komentowania ani żadnych innych funkcji opartych na interakcji społecznej.
- Integracje z zewnętrznymi platformami: Produkt nie będzie integrowany z innymi systemami e-learningowymi, kalendarzami czy narzędziami do notatek.
- Aplikacje mobilne: MVP będzie dostępne wyłącznie jako aplikacja internetowa (web-app). Dedykowane aplikacje na systemy iOS i Android nie są planowane w tej fazie.
- Obsługa długich tekstów: Sposób postępowania z tekstami przekraczającymi limit znaków API LLM nie jest zdefiniowany w MVP i na ten moment nie będzie obsługiwany.

## 5. Historyjki użytkowników

### Uwierzytelnianie i Autoryzacja

- ID: US-001
- Tytuł: Rejestracja nowego konta użytkownika
- Opis: Jako nowy użytkownik, chcę mieć możliwość założenia konta w serwisie przy użyciu adresu e-mail i hasła, aby móc bezpiecznie przechowywać swoje fiszki.
- Kryteria akceptacji:

  1. Istnieje formularz rejestracji z polami na adres e-mail i hasło.
  2. Po poprawnym wypełnieniu formularza i jego wysłaniu, w bazie danych tworzone jest nowe konto użytkownika.
  3. Użytkownik jest automatycznie zalogowany po pomyślnej rejestracji.
  4. System uniemożliwia rejestrację na już istniejący adres e-mail.
  5. Hasło jest przechowywane w bazie w formie zaszyfrowanej (hashed).

- ID: US-002
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę mieć możliwość zalogowania się na swoje konto przy użyciu e-maila i hasła, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:

  1. Istnieje formularz logowania z polami na adres e-mail i hasło.
  2. Po podaniu prawidłowych danych, użytkownik zostaje zalogowany i przekierowany do panelu głównego.
  3. W przypadku podania błędnych danych, użytkownik widzi stosowny komunikat o błędzie.

- ID: US-003
- Tytuł: Wylogowanie z systemu
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość wylogowania się z aplikacji, aby zapewnić bezpieczeństwo mojego konta.
- Kryteria akceptacji:

  1. W interfejsie użytkownika dostępny jest przycisk "Wyloguj".
  2. Po kliknięciu przycisku sesja użytkownika jest kończona, a on sam jest przekierowywany na stronę główną lub logowania.

- ID: US-004
- Tytuł: Prywatność fiszek
- Opis: Jako użytkownik, chcę mieć pewność, że tylko ja mam dostęp do moich fiszek i nikt inny nie może ich przeglądać.
- Kryteria akceptacji:
  1. Każda fiszka w bazie danych jest jednoznacznie przypisana do identyfikatora użytkownika.
  2. System podczas wyświetlania, edycji lub usuwania fiszek zawsze filtruje je po ID zalogowanego użytkownika.
  3. Próba dostępu do zasobu (fiszki) nienależącego do zalogowanego użytkownika jest blokowana.

### Tworzenie Fiszki

- ID: US-005
- Tytuł: Generowanie fiszek przy użyciu AI
- Opis: Jako student, chcę wkleić swoje notatki z wykładu do pola tekstowego, aby aplikacja automatycznie wygenerowała z nich propozycje fiszek i oszczędziła mój czas.
- Kryteria akceptacji:

  1. Na stronie głównej znajduje się duże pole tekstowe do wklejania notatek oraz przycisk "Generuj fiszki".
  2. Po wklejeniu tekstu i kliknięciu przycisku, system wysyła zapytanie do zewnętrznego API LLM.
  3. Wygenerowane przez AI pary Pytanie/Odpowiedź są wyświetlane użytkownikowi jako lista propozycji.
  4. Każda propozycja ma przyciski "Akceptuj" (np. kciuk w górę) i "Odrzuć" (np. kciuk w dół).

- ID: US-006
- Tytuł: Akceptacja wygenerowanej fiszki
- Opis: Jako użytkownik przeglądający propozycje od AI, chcę móc zaakceptować fiszkę, która jest dla mnie wartościowa, aby została dodana do mojej kolekcji.
- Kryteria akceptacji:

  1. Kliknięcie przycisku "Akceptuj" przy propozycji powoduje zapisanie fiszki w bazie danych i przypisanie jej do mojego konta.
  2. Zaakceptowana fiszka otrzymuje status "źródło: AI" oraz jest umieszczana w pierwszym "pudełku" systemu Leitnera.
  3. Propozycja znika z listy oczekujących na weryfikację.

- ID: US-007
- Tytuł: Odrzucenie wygenerowanej fiszki
- Opis: Jako użytkownik przeglądający propozycje od AI, chcę móc odrzucić fiszkę, która jest błędna lub nieprzydatna, aby nie zaśmiecała mojej kolekcji.
- Kryteria akceptacji:

  1. Kliknięcie przycisku "Odrzuć" przy propozycji powoduje jej usunięcie.
  2. Fiszka nie jest zapisywana w bazie danych.
  3. Propozycja znika z listy oczekujących na weryfikację.

- ID: US-008
- Tytuł: Ręczne tworzenie nowej fiszki
- Opis: Jako użytkownik, chcę mieć możliwość samodzielnego dodania nowej fiszki poprzez formularz, gdy mam konkretne pytanie i odpowiedź do zapamiętania.
- Kryteria akceptacji:
  1. Dostępny jest formularz z polami "Przód" (pytanie) i "Tył" (odpowiedź).
  2. Po wypełnieniu obu pól i zatwierdzeniu, nowa fiszka jest zapisywana w bazie danych i przypisywana do mojego konta.
  3. Nowa fiszka otrzymuje status "źródło: manualne" oraz jest umieszczana w pierwszym "pudełku" systemu Leitnera.
  4. Pola formularza są czyszczone po dodaniu fiszki, umożliwiając dodanie kolejnej.

### Zarządzanie Fiszkami

- ID: US-009
- Tytuł: Przeglądanie kolekcji fiszek
- Opis: Jako użytkownik, chcę mieć dostęp do listy wszystkich moich zapisanych fiszek, aby móc je przeglądać i zarządzać nimi.
- Kryteria akceptacji:

  1. Istnieje dedykowana sekcja/strona "Moje fiszki".
  2. Wyświetlana jest na niej tabela lub lista wszystkich fiszek należących do zalogowanego użytkownika.
  3. Każdy element listy pokazuje treść przodu i tyłu fiszki oraz kontrolki do edycji i usunięcia.

- ID: US-010
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę móc edytować treść moich istniejących fiszek, aby poprawić błędy lub przeformułować pytanie/odpowiedź.
- Kryteria akceptacji:

  1. Przy każdej fiszce na liście znajduje się przycisk "Edytuj".
  2. Kliknięcie przycisku otwiera formularz edycji z załadowanymi aktualnymi danymi fiszki.
  3. Po zapisaniu zmian, dane fiszki w bazie danych są aktualizowane.
  4. Użytkownik nie może edytować fiszek innych użytkowników.

- ID: US-011
- Tytuł: Usuwanie fiszki
- Opis: Jako użytkownik, chcę móc na stałe usunąć fiszkę ze swojej kolekcji, gdy uznam, że nie jest mi już potrzebna.
- Kryteria akceptacji:
  1. Przy każdej fiszce na liście znajduje się przycisk "Usuń".
  2. Kliknięcie przycisku "Usuń" wymaga od użytkownika dodatkowego potwierdzenia (np. w oknie modalnym).
  3. Po potwierdzeniu fiszka jest trwale usuwana z bazy danych.

### System Nauki

- ID: US-012
- Tytuł: Rozpoczęcie sesji nauki
- Opis: Jako student, chcę rozpocząć sesję nauki, aby aplikacja zaprezentowała mi fiszki, które wymagają powtórki w danym dniu zgodnie z algorytmem Leitnera.
- Kryteria akceptacji:

  1. Dostępny jest przycisk "Rozpocznij naukę".
  2. Po jego kliknięciu system pobiera wszystkie fiszki, które są zaplanowane do powtórki na dany dzień.
  3. Użytkownikowi wyświetlana jest pierwsza fiszka (tylko strona "Przód").
  4. Widoczny jest przycisk "Pokaż odpowiedź".

- ID: US-013
- Tytuł: Ocena znajomości odpowiedzi
- Opis: Podczas sesji nauki, po zobaczeniu odpowiedzi, chcę ocenić, czy ją znałem, aby system mógł odpowiednio zaktualizować pozycję fiszki w algorytmie Leitnera.
- Kryteria akceptacji:

  1. Po odsłonięciu odpowiedzi, użytkownik widzi dwa przyciski: "Wiedziałem" i "Nie wiedziałem".
  2. Kliknięcie "Wiedziałem" przesuwa fiszkę do następnego "pudełka" w systemie Leitnera i aktualizuje datę następnej powtórki.
  3. Kliknięcie "Nie wiedziałem" resetuje pozycję fiszki, przenosząc ją z powrotem do pierwszego "pudełka".
  4. Po ocenie, system automatycznie wyświetla kolejną fiszkę z bieżącej sesji.

- ID: US-014
- Tytuł: Zakończenie sesji nauki
- Opis: Jako użytkownik, po przejrzeniu wszystkich fiszek zaplanowanych na dany dzień, chcę otrzymać informację o zakończeniu sesji.
- Kryteria akceptacji:
  1. Gdy w bieżącej sesji nie ma już więcej fiszek do powtórki, system wyświetla ekran podsumowujący.
  2. Ekran podsumowujący może zawierać proste statystyki, np. liczbę powtórzonych fiszek.
  3. Użytkownik ma możliwość powrotu do panelu głównego.

## 6. Metryki sukcesu

Kluczowe wskaźniki efektywności (KPIs), które pozwolą ocenić sukces produktu w fazie MVP, są bezpośrednio związane z jego głównymi założeniami – efektywnością generatora AI i jego adopcją przez użytkowników.

- SM-001: Poziom akceptacji fiszek generowanych przez AI

  - Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika.
  - Sposób pomiaru: Metryka będzie obliczana jako stosunek liczby kliknięć przycisku "Akceptuj" (kciuk w górę) do całkowitej liczby fiszek zaproponowanych przez AI i przedstawionych użytkownikowi do weryfikacji. `(Liczba akceptacji / Liczba wszystkich propozycji) * 100%`.

- SM-002: Udział fiszek stworzonych przez AI w całkowitej liczbie fiszek
  - Cel: 75% wszystkich fiszek w systemie jest tworzonych przy pomocy generatora AI.
  - Sposób pomiaru: Metryka będzie obliczana jako stosunek liczby fiszek posiadających w bazie danych atrybut `source: 'AI'` do całkowitej liczby fiszek w systemie (zarówno stworzonych przez AI, jak i manualnie). `(Liczba fiszek z AI / Łączna liczba wszystkich fiszek) * 100%`.
