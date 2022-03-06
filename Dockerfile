FROM node:16-alpine as build
RUN apk update && apk upgrade

WORKDIR /usr/app
COPY package.json ./
COPY package-lock.json ./
COPY svelte.config.js ./
COPY tsconfig.json ./
COPY static static
COPY src src

RUN npm --quiet install
RUN npm run build

FROM nginx:mainline-alpine

COPY --from=build /usr/app/build /usr/share/nginx/html/admin
COPY nginx.conf /etc/nginx/nginx.conf
