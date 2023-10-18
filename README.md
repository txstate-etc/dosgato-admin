# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm init svelte@next

# create a new project in my-app
npm init svelte@next my-app
```

> Note: the `@next` is temporary

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Test

There is a test suite created under dosgato-admin/tests using playwright testing framework. It allows tests to be created for the admin UI and run cross most browsers and mobile devices.

Test suite configuration is in playwight.config.js. Setting up test options for whole suites and each project.

Tests will be executed in the order of the files under tests/src.

### Test Server setup
For test run, there is a set of test server docker instances configured in docker-compose.test.yml and a test container dosgato-e2e-test that will run all the tests against test server.  The test server app can also be accessed locally via
`http://localhost/.admin`
but require adding following line in your /etc/hosts:
 `127.0.0.1 fakeauth-test`

> Note: A proxy instance was added to resolve CORS issue in order to save and reuse cookies generated while using render service.

###Test run
To build test environment and run the test, simply run this script:
```bash
./test.sh
```
###Test data
Following folders are generated and reset everytime test.sh runs. 

```bash
 tests/.auth
 tests/artifacts
 tests/report
```
To view the report in html, in vscode, right click on tests/report/index.html and choose `Open with Live Server` on the top.

> Files generated under tests/.auth are tokens and cookies that were saved for each authenticated users and were reused in the test cases.