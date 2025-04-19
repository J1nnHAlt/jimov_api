FROM node


COPY src /anime/src/
COPY package.json /anime/


WORKDIR /anime

RUN npm i 

COPY . .

WORKDIR /anime/src/

CMD [ "npx", "ts-node", "index.ts" ]




