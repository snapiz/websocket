FROM node:12-slim

ENV NODE_ENV=production

WORKDIR /app

COPY ["server/package.json", "yarn.lock", "./"]

RUN yarn install

COPY server/dist/* .

EXPOSE 80

CMD [ "node", "server.worker.js" ]
