FROM node:18-alpine as build
RUN apk update && apk upgrade

WORKDIR /usr/app
COPY package.json ./
COPY package-lock.json ./
COPY svelte.config.js ./
COPY tsconfig.json ./
COPY src src

RUN npm --quiet install
RUN echo "export const schemaVersion = '$(date +"%Y%m%d%H%M%S")'" > src/lib/schemaversion.ts
RUN npm run build

FROM nginx:mainline-alpine

COPY --from=build /usr/app/build /usr/share/nginx/html/.admin
COPY nginx.conf /etc/nginx/nginx-template.conf
COPY nginx-env.sh /docker-entrypoint.d/40-nginx-env.sh
