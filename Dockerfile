FROM ubuntu:bionic

WORKDIR /usr/src/app

ENV DEBIAN_FRONTEND noninteractive
ENV DEBUGGING_TOOLS 'emacs netcat iputils-ping dnsutils less curl gdb net-tools tcpdump'

COPY package.json package-lock.json /usr/src/app/

RUN apt-get clean && apt-get update && apt-get install -y \
  ${DEBUGGING_TOOLS} && \
  curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
  apt-get install -y nodejs && \
  npm i -g node-gyp && \
  npm i && npm remove -g node-gyp && npm cache clean --force && \
  rm -rf /var/lib/apt/lists/* && \
  apt-get remove -y --purge ${BUILD_PACKAGES} && apt-get -y autoremove

COPY ./tcp_connect.sh /usr/src/app
COPY ./socket_tester.js /usr/src/app

RUN bash
