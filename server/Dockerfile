# GigSync API - production image
# Works on Render or Railway (either can build directly from render.yaml /
# railway.json instead, but this Dockerfile is here as a portable fallback
# if you ever need a plain container build).

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
