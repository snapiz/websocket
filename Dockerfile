FROM node:12-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY ["server/package.json", "yarn.lock", "./"]

RUN ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2
RUN yarn install

COPY server/dist/* ./

EXPOSE 80

CMD [ "node", "server.worker.js" ]
