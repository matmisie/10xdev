import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly startStudySessionButton: Locator;
  readonly aiTextInput: Locator;
  readonly generateFlashcardsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startStudySessionButton = page.locator('[data-test-id="start-study-session-button"]');
    this.aiTextInput = page.locator('[data-test-id="ai-text-input"]');
    this.generateFlashcardsButton = page.locator('[data-test-id="ai-generate-button"]');
  }

  async navigate() {
    await this.page.goto("/app/dashboard");
  }

  async startStudySession() {
    await this.startStudySessionButton.click();
  }

  async generateAiSuggestions(text: string) {
    await this.aiTextInput.fill(text);
    await expect(this.generateFlashcardsButton).toBeEnabled();
    await this.generateFlashcardsButton.click();
  }
} 