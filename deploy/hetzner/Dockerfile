# Builds the site with Node and serves it with server.py, which also takes
# the quote form. Only the built site and the server end up in the image.
FROM node:22.23.4-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL
RUN SITE_URL="$SITE_URL" npm run build

FROM python:3.12-slim
WORKDIR /app
# Quote requests land in leads/, a volume; the server never runs as root.
RUN useradd --system site && mkdir leads && chown site leads
COPY server.py ./
COPY --from=build /src/dist ./dist
USER site
CMD ["python3", "server.py", "8040", "0.0.0.0"]
