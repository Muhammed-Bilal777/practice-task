FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./dist ./dist 

EXPOSE 4040

CMD ["node", "."] 
