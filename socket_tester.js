/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable comma-dangle */
const assert = require('assert');
const child_process = require('child_process');
const { Resolver } = require('dns').promises;
const net = require('net');
const stun = require('stun');

const resolver = new Resolver();

const NUM_SOCKETS_PER_TEST = 30;
const TIMEOUTS = [1, 10, 30, 60];
const PORTS = [80, 443];
const HOSTS = ['microsoft.com', 'baidu.com'];

const STUN_SERVERS = [
  'stun.l.google.com:19302',
  'stun1.l.google.com:19302',
  'stun2.l.google.com:19302',
  'stun3.l.google.com:19302',
  'stun4.l.google.com:19302',
];

const TEST_TIME = new Date().getTime();
console.log(`Test time is ${TEST_TIME}`);

function reflectIP() {
  const randomIndex = Math.floor(Math.random() * STUN_SERVERS.length);
  const server = STUN_SERVERS[randomIndex];
  stun.request(server, (error, result) => {
    if (error) {
      console.log(error.message);
    }
    if (result) {
      console.log(
        `Current reflected address=${result.getXorAddress().address}`,
      );
    }
  });
}

function startTCPDump(dstaddr, dstport, timeout) {
  const outfile = `tcpdump-${dstaddr}:${dstport}-${timeout}s-${TEST_TIME}.pcap`;
  const cmd = `tcpdump -n "port ${dstport} and dst ${dstaddr}" -w ${outfile}`;
  console.log(`tcpdump pcap output=${outfile}`);
  return child_process.spawn('/bin/sh', ['-c', cmd], {
    detached: true,
  });
}

function runSocketTest(address, port, connectTimeoutMillis) {
  return new Promise((resolve) => {
    try {
      const startTime = new Date();
      const socket = new net.Socket();
      setTimeout(() => {
        if (socket.connecting) {
          console.log(
            `socket connect timeout srcport=${socket.localPort}`,
          );
          socket.destroy();
          resolve({
            success: false,
          });
        }
      }, connectTimeoutMillis);
      socket.on('connect', () => {
        const stopTime = new Date();
        const connectTime = stopTime.getTime() - startTime.getTime();
        // console.log(
        //   `socket connected srcport=${socket.localPort}, `
        //   + `connectTime=${connectTime}`,
        // );
        socket.destroy();
        resolve({
          success: true,
          connectTime,
        });
      });
      socket.on('error', (error) => {
        console.log(
          `socket srcport=${socket.localPort}, error: ${error.message}`,
        );
        resolve({
          success: false,
        });
      });
      socket.connect({
        host: address,
        port,
      });
    } catch (e) {
      console.log(e.message);
      console.log(e.stack);
      resolve({
        success: false,
      });
    }
  });
}

async function main() {
  reflectIP();
  for (let i = 0; i < HOSTS.length; i += 1) {
    const host = HOSTS[i];
    const startTime = new Date();
    const targetAddresses = await resolver.resolve4(host);
    assert(targetAddresses.length > 0);
    const targetAddress = targetAddresses[0];
    const lookupTime = new Date();
    const lookupDuration = lookupTime.getTime() - startTime.getTime();
    for (let j = 0; j < PORTS.length; j += 1) {
      const port = PORTS[j];
      for (let l = 0; l < TIMEOUTS.length; l += 1) {
        try {
          const timeout = TIMEOUTS[l];
          const tcpdump = startTCPDump(targetAddress, port, timeout);
          // wait for tcpdump to bind to nic
          await new Promise(resolve => setTimeout(resolve, 5000));

          console.log(
            `begin test: target host ${host}: ${targetAddress}:${port}, `
            + `lookup time=${lookupDuration}ms, `
            + `timeout=${timeout}s`
          );
          const promises = [];
          for (let m = 0; m < NUM_SOCKETS_PER_TEST; m += 1) {
            promises.push(runSocketTest(
              targetAddress, port, timeout * 1000,
            ));
          }
          const results = await Promise.all(promises);
          let minConnectTime = Number.POSITIVE_INFINITY;
          let maxConnectTime = -1;
          let avgConnectTime = 0;
          let successCount = 0;
          results.forEach((result) => {
            if (result.success) {
              successCount += 1;
              avgConnectTime += result.connectTime;
              if (minConnectTime > result.connectTime) {
                minConnectTime = result.connectTime;
              }
              if (maxConnectTime < result.connectTime) {
                maxConnectTime = result.connectTime;
              }
            }
          });
          avgConnectTime /= NUM_SOCKETS_PER_TEST;
          const successRate = (
            100 * successCount / NUM_SOCKETS_PER_TEST
          ).toFixed(2);
          console.log(
            `Timeout=${timeout}s, dstport=${port}, dstaddr=${targetAddress}, `
            + `successRate=${successRate}%, `
            + `minConnectTime=${minConnectTime}ms, `
            + `maxConnectTime=${maxConnectTime}ms, `
            + `avgConnectTime=${avgConnectTime.toFixed(2)}ms`
          );
          await new Promise(resolve => setTimeout(resolve, 5000));
          process.kill(-tcpdump.pid);
        } catch (e) {
          console.log(e.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.log('done');
}

main();
