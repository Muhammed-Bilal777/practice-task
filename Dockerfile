

 
FROM node:18-slim

 WORKDIR /usr/src/app

 COPY package*.json ./

 
RUN npm install

 
COPY ./src ./src

 
COPY ./dist ./dist

 
EXPOSE 4040

# Command to run the app when the container starts
CMD ["node", "dist/app.js"]
