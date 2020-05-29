#!/bin/bash

TARGET_HOST=microsoft.com
ADDR=$(dig +short ${TARGET_HOST} | tail -1)
echo "Src reflected address $(curl -s ipv4.icanhazip.com)"
echo "Target address ${ADDR}"
tcpdump -n "port 443 and dst ${ADDR}" &
TCPDUMP_PID=$!
sleep 5
for i in `seq 30`; do ( nc -v -w 1 -n ${ADDR} 443 & ); done;
sleep 5
kill ${TCPDUMP_PID}
