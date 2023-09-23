import {test as base, type Page, type Locator} from '@playwright/test'
import * as fs from 'fs'
import { adminSession, editorSession } from './constants';

class UserPage {
  page: Page;
  greeting: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.locator('button.login-status');
  }
}

type MyFixtures = {
  adminPage: UserPage;
  editorPage: UserPage;
}

const fixture = base.extend<MyFixtures>({
  adminPage: async ({browser}, use) =>{
    const sessionStorage = JSON.parse(fs.readFileSync(adminSession, 'utf-8'));
    const context = await browser.newContext()
    await context.addInitScript((storage) => {
      const entries = Object.entries(JSON.parse(storage));
      for (let i = 0; i < entries.length; i += 1) {
        const [key, value]: [key: string, value: any] = entries[i];
        window.sessionStorage.setItem(key, value);
      }
    }, sessionStorage);
    const adminPage = new UserPage(await context.newPage());
    await use(adminPage);
    await context.close();
  },
  editorPage: async ({ browser }, use) =>{
    const sessionStorage = JSON.parse(fs.readFileSync(editorSession, 'utf-8'));
    const context = await browser.newContext()
    await context.addInitScript((storage) => {
      const entries = Object.entries(JSON.parse(storage));
      for (let i = 0; i < entries.length; i += 1) {
        const [key, value]: [key: string, value: any] = entries[i];
        window.sessionStorage.setItem(key, value);
      }
    }, sessionStorage);
    const editorPage = new UserPage(await context.newPage());
    await use(editorPage);
    await context.close();
  }
})

export const test = fixture;
export const expect = fixture.expect;