import {test as base} from '@playwright/test'
import * as fs from 'fs'

const fixture = base.extend({
  // override `context` fixture to add init script
  context: async ({ context }, use) => {
    const sessionStorage = JSON.parse(fs.readFileSync('tests/.auth/session.json', 'utf-8'));
    await context.addInitScript((storage) => {
      const entries = Object.entries(JSON.parse(storage));
      for (let i = 0; i < entries.length; i += 1) {
        const [key, value]: [key: string, value: any] = entries[i];
        window.sessionStorage.setItem(key, value);
        console.log(window.sessionStorage.toString(), 'window.sessionStorage');
      }
    }, sessionStorage);
    await use(context);
  },
})

export const test = fixture;
export const expect = fixture.expect;