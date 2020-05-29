
# TCP connection tester

Linux docker guest will establish a handful of TCP connections to the endpoint
specified in line 3 of `tcp_connect.sh`. Performs a single DNS lookup, checks
for the current externally reflected IP address, sets up tcpdump on this target
address, and establishes a sequence of sockets.

If all works well, you'll see all sockets report open, like this:
https://gist.github.com/wobbals/7b808682562c9bb8129e8bfd853f605b

If not, you might see connection timeouts, like this:
https://gist.github.com/tomnguyenn/15cea6a1cdb53d7a082bed1e543efc9e#file-gistfile1-txt-L93

## Step 0: Prerequisites

* Install Docker: https://www.docker.com/get-started

## Step 1: Pull test image

Prebuilt image is available on dockerhub. It's a bit large, so consider where
you are pulling from:

```
docker pull wobbals/tmotester:latest
```

### 1b: or, build it yourself

Don't trust some stranger on the internet. Feel free to review the scripts in
this repository, and build the image to run locally:

```
docker build -t wobbals/tmotester:latest .
```


## Step 2: Run the test script

```
docker run -it wobbals/tmotester:latest tcp_connect.sh
```
