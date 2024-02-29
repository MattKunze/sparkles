FROM node:lts

WORKDIR /app

RUN npm install -g bun

COPY package.json .
RUN bun install

COPY start.sh .
COPY *.ts .

CMD ["sh", "start.sh"]
