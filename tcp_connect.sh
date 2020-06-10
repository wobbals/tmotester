#!/bin/bash

CONNECT_TIMEOUT_SECONDS=10
PORT=443
TARGET_HOST=microsoft.com
ADDR=$(dig +short ${TARGET_HOST} | tail -1)
echo "Test started at $(date)"
echo "Src reflected address $(curl -s ipv4.icanhazip.com)"
echo "Target address ${ADDR}"
echo "Target hostname ${TARGET_HOST}"
echo "Connect timeout time is ${CONNECT_TIMEOUT_SECONDS}s"
echo "Target port is ${PORT}"
tcpdump -n "port ${PORT} and dst ${ADDR}" &
TCPDUMP_PID=$!
sleep 5
for i in `seq 30`; do ( nc -v -w ${CONNECT_TIMEOUT_SECONDS} -n ${ADDR} ${PORT} & ); done;
sleep ${CONNECT_TIMEOUT_SECONDS}
sleep 5
kill ${TCPDUMP_PID}
