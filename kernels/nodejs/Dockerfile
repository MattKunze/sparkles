FROM node:lts-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY start.sh .
COPY *.ts .

CMD ["sh", "start.sh"]
