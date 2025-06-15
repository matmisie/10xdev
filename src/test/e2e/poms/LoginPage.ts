import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-test-id="login-email-input"]');
    this.passwordInput = page.locator('[data-test-id="login-password-input"]');
    this.submitButton = page.locator('[data-test-id="login-submit-button"]');
  }

  async navigate() {
    await this.page.goto("/login");
  }

  async login(email: string, password_val: string) {
    await this.emailInput.pressSequentially(email, { delay: 50 });
    await this.passwordInput.pressSequentially(password_val, { delay: 50 });
    await this.submitButton.click();
  }
} 