import { type Page, type Locator } from "@playwright/test";

export class SuggestionReviewPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  getSuggestionCard(suggestionId: string): Locator {
    return this.page.locator(`[data-test-id="suggestion-card-${suggestionId}"]`);
  }

  getAcceptButton(cardLocator: Locator): Locator {
    return cardLocator.locator('[data-test-id="accept-suggestion-button"]');
  }

  getRejectButton(cardLocator: Locator): Locator {
    return cardLocator.locator('[data-test-id="reject-suggestion-button"]');
  }

  async acceptSuggestion(suggestionId: string) {
    const card = this.getSuggestionCard(suggestionId);
    await this.getAcceptButton(card).click();
  }

  async rejectSuggestion(suggestionId: string) {
    const card = this.getSuggestionCard(suggestionId);
    await this.getRejectButton(card).click();
  }

  async getAllSuggestionCards(): Promise<Locator[]> {
    return this.page.locator('[data-test-id^="suggestion-card-"]').all();
  }
} 