import { test as baseTest } from '@playwright/test';
const { V8toIstanbul } = require('@c88/v8-coverage');
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const nycOutput = path.join(process.cwd(), '.nyc_output');

export const test = baseTest.extend({
  page: async ({ page }, use) => {
    await page.coverage.startJSCoverage();
    await use(page);
    const coverage = await page.coverage.stopJSCoverage();
    const
      results = coverage
        .filter(entry => entry.url.startsWith('http://localhost:3000'))
        .filter(entry => entry.url.includes('src'));

    for (const entry of results) {
      const converter = V8toIstanbul(entry.url, 0, {
        source: entry.source,
      }, (path: string) => path.startsWith('http://localhost:3000/src'));

      if (converter) {
        await converter.load();
        converter.applyCoverage(entry.functions);

        const filePath = path.join(nycOutput, `coverage-${crypto.randomUUID()}.json`);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, JSON.stringify(converter.toIstanbul()));
      }
    }
  }
});

export { expect } from '@playwright/test'; 