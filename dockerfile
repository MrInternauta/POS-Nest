# Legacy AWS deploy (ECR image built by buildspec.yaml, run on the k8s/ cluster).
# Production moved to Vercel (vercel.json, .github/workflows/api.yml); this path is kept as a reference.
# It still copies .env into the image, so the secrets travel inside it: build it only from a trusted machine.
FROM node:22-alpine as builder



COPY ["package.json", ".env", "/usr/src/"]

WORKDIR /usr/src


RUN npm install

COPY [".", "/usr/src/"]


  RUN npm run build

  EXPOSE 3000


# Productive image
FROM node:22-alpine as prod


ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}




COPY ["package.json", ".env", "/usr/src/"]
WORKDIR /usr/src


RUN npm install

COPY --from=builder ["/usr/src/", "/usr/src/"]

RUN npm run build

EXPOSE 3000

CMD npm run start:prod
