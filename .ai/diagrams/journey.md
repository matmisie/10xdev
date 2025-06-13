```mermaid
stateDiagram-v2
    [*] --> StrefaPubliczna

    state StrefaPubliczna {
        [*] --> StronaGlowna
        StronaGlowna --> FormularzLogowania: Kliknięcie "Zaloguj"
        StronaGlowna --> FormularzRejestracji: Kliknięcie "Zarejestruj"

        state FormularzLogowania {
            [*] --> WprowadzanieDanych
            WprowadzanieDanych --> WalidacjaDanych: Kliknięcie "Zaloguj"
            WalidacjaDanych --> BłądLogowania: Dane niepoprawne
            WalidacjaDanych --> WeryfikacjaSesji: Dane poprawne
            BłądLogowania --> WprowadzanieDanych: Spróbuj ponownie
        }

        state FormularzRejestracji {
            [*] --> WprowadzanieDanych
            WprowadzanieDanych --> WalidacjaDanych: Kliknięcie "Zarejestruj"
            WalidacjaDanych --> BłądRejestracji: Dane niepoprawne
            WalidacjaDanych --> TworzenieKonta: Dane poprawne
            BłądRejestracji --> WprowadzanieDanych: Spróbuj ponownie
        }
    }

    state StrefaChroniona {
        [*] --> Dashboard
        Dashboard --> ListaFiszek: Przejście do fiszek
        Dashboard --> GeneratorAI: Generowanie fiszek
        Dashboard --> Wylogowanie: Kliknięcie "Wyloguj"

        state Wylogowanie {
            [*] --> Potwierdzenie
            Potwierdzenie --> Anulowanie: "Anuluj"
            Potwierdzenie --> WylogowanieWykonane: "Potwierdź"
            Anulowanie --> Dashboard
        }
    }

    WeryfikacjaSesji --> StrefaChroniona: Sesja poprawna
    WeryfikacjaSesji --> FormularzLogowania: Sesja niepoprawna
    TworzenieKonta --> StrefaChroniona: Konto utworzone
    WylogowanieWykonane --> StrefaPubliczna

    note right of StrefaPubliczna
        Dostępne bez logowania:
        - Formularz logowania
        - Formularz rejestracji
    end note

    note right of StrefaChroniona
        Dostępne po zalogowaniu:
        - Dashboard
        - Lista fiszek
        - Generator AI
    end note

    note right of FormularzLogowania
        Walidacja:
        - Format email
        - Hasło niepuste
    end note

    note right of FormularzRejestracji
        Walidacja:
        - Format email
        - Siła hasła
        - Unikalność email
    end note
```
