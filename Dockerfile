FROM node:lts

WORKDIR /app

COPY package.json ./
RUN npm install

COPY  next.config.js \
  postcss.config.js \
  tailwind.config.ts \
  tsconfig.json ./

COPY public ./public
COPY src ./src

# TODO - run production build, currently failing due to environment during build
# RUN npm run build

CMD ["npm", "run", "dev"]
