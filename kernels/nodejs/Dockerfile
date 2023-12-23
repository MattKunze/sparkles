FROM node:lts

WORKDIR /app

COPY package.json .
RUN npm install

COPY start.sh .
COPY *.ts .

CMD ["sh", "start.sh"]
