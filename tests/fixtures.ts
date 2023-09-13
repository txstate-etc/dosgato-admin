import {test as base} from '@playwright/test'
import * as fs from 'fs'

const fixture = base.extend({
  // override `context` fixture to add init script
  context: async ({ context }, use) => {
    const sessionStorage = JSON.parse(fs.readFileSync('tests/.auth/session.json', 'utf-8'));
    // console.log(sessionStorage, 'sessionStorage 1')
    // console.log(JSON.parse(sessionStorage).token, 'token')
    await context.addInitScript((storage) => {
      const entries = Object.entries(JSON.parse(storage));
      for (let i = 0; i < entries.length; i += 1) {
        const [key, value]: [key: string, value: any] = entries[i];
        window.sessionStorage.setItem(key, value);
        console.log(window.sessionStorage.toString(), 'window.sessionStorage');
      }
    }, sessionStorage);
    // for setting cookies right to access render for editing
    const token = JSON.parse(sessionStorage).token
    await context.addCookies([
      {name:"dg_token", value: token, domain: "dosgato-render-test", path: "/.edit/", httpOnly: true, secure: false, sameSite: "Lax"},
      {name:"dg_token", value: token, domain: "dosgato-render-test", path: "/.preview/", httpOnly: true, secure: false, sameSite: "Lax"},
      {name:"dg_token", value: token, domain: "dosgato-render-test", path: "/.compare/", httpOnly: true, secure: false, sameSite: "Lax"},
      {name:"dg_token", value: token, domain: "dosgato-render-test", path: "/.asset/", httpOnly: true, secure: false, sameSite: "Lax"},
      {name:"dg_token", value: token, domain: "dosgato-render-test", path: "/.page/", httpOnly: true, secure: false, sameSite: "Lax"}
    ])
    // await context.storageState({path: 'tests/.auth/storageState.json'})
    await use(context);
    console.log((await context.storageState()).cookies, 'COOOOOOOOOOOOOOOOKKKKKKIIIIIIEEEE')
  },
});

export const test = fixture;
export const expect = fixture.expect;