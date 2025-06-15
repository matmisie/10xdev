import { test as baseTest } from "@playwright/test";

export const test = baseTest.extend({
  page: async ({ page }, use) => {
    await page.coverage.startJSCoverage();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await page.coverage.stopJSCoverage();
  },
});

export { expect } from "@playwright/test";
