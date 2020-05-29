FROM ubuntu:bionic

WORKDIR /
ENV DEBIAN_FRONTEND noninteractive
ENV DEBUGGING_TOOLS 'emacs netcat iputils-ping dnsutils less curl gdb net-tools tcpdump'

RUN apt-get clean && apt-get update && apt-get install -y \
  ${DEBUGGING_TOOLS} \
  && rm -rf /var/lib/apt/lists/*

COPY ./tcp_connect.sh /usr/local/bin

RUN bash