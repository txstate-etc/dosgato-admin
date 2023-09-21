import {test as base, type Page, type Locator} from '@playwright/test'
import * as fs from 'fs'

class AdminPage {
  page: Page;
  greeting: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.locator('#greeting');
  }
}

type MyFixtures = {
  adminPage: AdminPage;
}

const fixture = base.extend<MyFixtures>({
  adminPage: async ({browser, context}, use) =>{
    const sessionStorage = JSON.parse(fs.readFileSync('tests/.auth/session.json', 'utf-8'));
    await context.addInitScript((storage) => {
      const entries = Object.entries(JSON.parse(storage));
      for (let i = 0; i < entries.length; i += 1) {
        const [key, value]: [key: string, value: any] = entries[i];
        window.sessionStorage.setItem(key, value);
        console.log(window.sessionStorage.toString(), 'window.sessionStorage');
      }
    }, sessionStorage);
    const adminPage = new AdminPage(await context.newPage());
    await use(adminPage);
    await context.close();
  }
  // // override `context` fixture to add init script
  // context: async ({ context }, use) => {
  //   const sessionStorage = JSON.parse(fs.readFileSync('tests/.auth/session.json', 'utf-8'));
  //   await context.addInitScript((storage) => {
  //     const entries = Object.entries(JSON.parse(storage));
  //     for (let i = 0; i < entries.length; i += 1) {
  //       const [key, value]: [key: string, value: any] = entries[i];
  //       window.sessionStorage.setItem(key, value);
  //       console.log(window.sessionStorage.toString(), 'window.sessionStorage');
  //     }
  //   }, sessionStorage);
  //   await use(context);
  // },
})

export const test = fixture;
export const expect = fixture.expect;