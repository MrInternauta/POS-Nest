FROM node:18.6.0-alpine as builder



COPY ["package.json", ".env", "/usr/src/"]

WORKDIR /usr/src


RUN npm install

COPY [".", "/usr/src/"]


  RUN npm run build

  EXPOSE 3000


# Productive image
FROM node:18.6.0-alpine as prod


ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}




COPY ["package.json", ".env", "/usr/src/"]
WORKDIR /usr/src


RUN npm install

COPY --from=builder ["/usr/src/", "/usr/src/"]

RUN npm run build

EXPOSE 3000

CMD npm run start:prod
