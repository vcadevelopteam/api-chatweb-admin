FROM node:16-alpine
ARG CONFIGFILE=.env \
    NODE_ENV=production \
    PORT=6065

RUN apk --update add ttf-freefont fontconfig && rm -rf /var/cache/apk/*
ENV PHANTOMJS_VERSION=2.1.1
ENV OPENSSL_CONF=/etc/ssl/
RUN apk add --no-cache curl && \
    cd /tmp && curl -Ls https://github.com/topseom/phantomized/releases/download/${PHANTOMJS_VERSION}/dockerized-phantomjs.tar.gz | tar xz && \
    cp -R lib lib64 / && \
    cp -R usr/lib/x86_64-linux-gnu /usr/lib && \
    cp -R usr/share /usr/share && \
    cp -R etc/fonts /etc && \
    curl -k -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 | tar -jxf - && \
    cp phantomjs-${PHANTOMJS_VERSION}-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs && \
    rm -fR phantomjs-${PHANTOMJS_VERSION}-linux-x86_64 && \
    apk del curl

WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN apk add g++ make py3-pip
RUN npm install --${NODE_ENV}
COPY . .
EXPOSE ${PORT}
COPY "${CONFIGFILE}" ./.env
COPY "voximplant_credentials.json" ./voximplant_credentials.json
CMD npm run start