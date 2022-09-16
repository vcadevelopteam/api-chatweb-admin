FROM node:16-alpine
ARG CONFIGFILE=.env \
    NODE_ENV=production \
    PORT=6065
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --${NODE_ENV}
COPY . .
EXPOSE ${PORT}
COPY "${CONFIGFILE}" ./.env
CMD npm run start