FROM mcr.microsoft.com/playwright:v1.53.1

COPY package.json ./
RUN npm install --omit=dev
COPY tsconfig.json ./
COPY playwright.config.ts ./
COPY tests tests
COPY common.ts ./
COPY fixtures.ts ./

CMD ["npm", "run", "playwright"]
