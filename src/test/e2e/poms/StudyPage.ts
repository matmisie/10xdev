import { type Page, type Locator } from "@playwright/test";

export class StudyPage {
  readonly page: Page;
  readonly showAnswerButton: Locator;
  readonly gradeCorrectButton: Locator;
  readonly gradeIncorrectButton: Locator;
  readonly sessionSummaryCard: Locator;
  readonly backToDashboardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.showAnswerButton = page.locator('[data-test-id="show-answer-button"]');
    this.gradeCorrectButton = page.locator('[data-test-id="grade-correct-button"]');
    this.gradeIncorrectButton = page.locator('[data-test-id="grade-incorrect-button"]');
    this.sessionSummaryCard = page.locator('[data-test-id="session-summary-card"]');
    this.backToDashboardButton = page.locator('[data-test-id="back-to-dashboard-button"]');
  }

  async gradeCurrentCard(knowsAnswer: boolean) {
    await this.showAnswerButton.click();
    if (knowsAnswer) {
      await this.gradeCorrectButton.click();
    } else {
      await this.gradeIncorrectButton.click();
    }
  }

  async isSummaryVisible() {
    return this.sessionSummaryCard.isVisible();
  }
} 