import { test, expect } from "@playwright/test";
import { LoginPage } from "./poms/LoginPage";
import { DashboardPage } from "./poms/DashboardPage";
import { SuggestionReviewPage } from "./poms/SuggestionReviewPage";
import { StudyPage } from "./poms/StudyPage";

const SAMPLE_TEXT_FOR_GENERATION = `
Playwright to narzędzie do automatyzacji przeglądarek internetowych stworzone przez Microsoft.
Umożliwia testowanie aplikacji webowych w różnych przeglądarkach, takich jak Chromium, Firefox i WebKit.
Jedną z kluczowych zalet Playwright jest jego zdolność do interakcji ze stronami tak, jak robi to prawdziwy użytkownik.
Testy w Playwright są z natury stabilne dzięki mechanizmom auto-wait, które czekają na gotowość elementów przed wykonaniem akcji.
`;

test.describe("Full User Flow: AI Generation and Study Session", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let suggestionReviewPage: SuggestionReviewPage;
  let studyPage: StudyPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    suggestionReviewPage = new SuggestionReviewPage(page);
    studyPage = new StudyPage(page);

    // Krok 1: Logowanie
    await loginPage.navigate();
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("Test environment variables for user credentials are not set in .env.test");
    }
    await loginPage.login(email, password);
    await expect(page).toHaveURL("/app/dashboard");
  });

  test("should generate, review, and then study new flashcards", async ({ page }) => {
    // --- START OF UNIQUE TEXT GENERATION ---
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not set in .env.test");
    }

    let uniqueSampleText = "";
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "mistralai/mistral-7b-instruct:free",
          "messages": [
            { "role": "user", "content": "Opisz w 2-3 zdaniach mało znany, ciekawy fakt naukowy. Odpowiedź podaj w języku polskim. Nie używaj formatowania markdown." }
          ]
        })
      });
      const data = await response.json();
      uniqueSampleText = data.choices[0].message.content;
      console.log(`[AI PROMPT] Generated unique text for test: "${uniqueSampleText}"`);
    } catch (error) {
      console.error("Failed to fetch unique text from OpenRouter:", error);
      // Fallback to timestamp-based uniqueness if API fails
      uniqueSampleText = `Nie udało się pobrać tekstu z OpenRouter. ID Testu: ${Date.now()}`;
    }
    // --- END OF UNIQUE TEXT GENERATION ---
    
    // Krok 2: Generowanie sugestii na podstawie unikalnego tekstu
    await dashboardPage.generateAiSuggestions(uniqueSampleText);
    await page.waitForURL("/app/review-suggestions", { timeout: 60000 });

    // Krok 3: Poczekaj na pojawienie się pierwszej karty i zweryfikuj sugestie
    const firstCardLocator = suggestionReviewPage.page.locator('[data-test-id^="suggestion-card-"]').first();
    await expect(firstCardLocator).toBeVisible({ timeout: 60000 });

    let acceptedCount = 0;
    let cardsProcessed = 0;

    // Przetwarzaj karty jedna po drugiej, dopóki jakiekolwiek istnieją
    while ((await suggestionReviewPage.page.locator('[data-test-id^="suggestion-card-"]').count()) > 0) {
      // Zawsze pracuj na pierwszej karcie z listy
      const currentCard = suggestionReviewPage.page.locator('[data-test-id^="suggestion-card-"]').first();

      // Zawsze akceptuj pierwszą sugestię, aby zagwarantować, że sesja nauki się odbędzie
      const shouldAccept = cardsProcessed === 0 ? true : Math.random() > 0.5;
      
      if (shouldAccept) {
        // Poczekaj na pomyślną odpowiedź (2xx) z API po kliknięciu "Akceptuj"
        await Promise.all([
          suggestionReviewPage.page.waitForResponse(resp => resp.url().includes('/accept') && resp.ok()),
          suggestionReviewPage.getAcceptButton(currentCard).click()
        ]);
        acceptedCount++;
      } else {
        // Poczekaj na pomyślną odpowiedź (2xx) z API po kliknięciu "Odrzuć" (metodą PATCH)
        await Promise.all([
          suggestionReviewPage.page.waitForResponse(resp => 
            !!resp.url().match(/\/api\/ai-suggestions\/[a-f0-9-]+$/i) && 
            resp.request().method() === 'PATCH' && 
            resp.ok()
          ),
          suggestionReviewPage.getRejectButton(currentCard).click()
        ]);
      }
      cardsProcessed++;
    }

    // Krok 4: Upewnij się, że aplikacja wróciła do panelu i jest gotowa na dalsze akcje
    await expect(page.locator("h1", { hasText: "Witaj w panelu!" })).toBeVisible({ timeout: 10000 });

    // Jeśli przynajmniej jedna fiszka została zaakceptowana, przejdź do sesji nauki
    if (acceptedCount > 0) {
      // Krok 5: Rozpoczęcie sesji nauki
      await dashboardPage.startStudySession();
      await expect(page).toHaveURL("/app/study");

      // Krok 6: Poczekaj na załadowanie pierwszej fiszki i przejdź przez sesję
      await expect(studyPage.showAnswerButton).toBeVisible({ timeout: 10000 });
      
      while (await studyPage.showAnswerButton.isVisible({ timeout: 5000 })) {
        const knowsAnswer = Math.random() > 0.5;
        
        // Poczekaj na odpowiedź z API po ocenie karty
        await Promise.all([
          page.waitForResponse(resp => 
            resp.url().includes('/review') && 
            resp.request().method() === 'POST' &&
            resp.ok()
          ),
          studyPage.gradeCurrentCard(knowsAnswer)
        ]);
      }

      // Krok 7: Sprawdzenie, czy widoczne jest podsumowanie sesji
      await expect(studyPage.sessionSummaryCard).toBeVisible({ timeout: 10000 });
      await expect(studyPage.backToDashboardButton).toBeVisible();
    } else {
      console.log("Test info: Żadna sugestia nie została zaakceptowana, pomijam część testu z sesją nauki.");
    }
  });
}); 