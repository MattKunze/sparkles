FROM node:lts

WORKDIR /app

RUN corepack enable

COPY package.json .
RUN pnpm install

COPY start.sh .
COPY *.ts .

CMD ["sh", "start.sh"]
