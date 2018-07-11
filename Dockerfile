FROM node:4
ADD . .
RUN npm install
EXPOSE 3100
CMD npm start
