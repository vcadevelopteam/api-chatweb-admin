FROM node:16-alpine
ARG CONFIGFILE=.env \
    NODE_ENV=production \
    PORT=6065
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --${NODE_ENV}
RUN sudo apt-get update
RUN sudo apt-get install libgdiplus
RUN sudo apt install ffmpeg
COPY . .
EXPOSE ${PORT}
COPY "${CONFIGFILE}" ./.env
CMD npm run start