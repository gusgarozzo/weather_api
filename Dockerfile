FROM node:20-alpine AS builder

RUN apk add --no-cache curl wget

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS production

ENV NODE_ENV production
ENV PORT 3000

WORKDIR /usr/src/app

COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/dist ./dist

EXPOSE ${PORT}

CMD [ "node", "dist/main" ]
