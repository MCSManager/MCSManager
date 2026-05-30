ARG BUILDPLATFORM=linux/amd64
FROM --platform=${BUILDPLATFORM} node:lts-alpine AS builder

WORKDIR /src
COPY . /src

RUN chmod a+x ./install-dependents.sh &&\
    chmod a+x ./build.sh &&\
    ./install-dependents.sh &&\
    ./build.sh

FROM ghcr.io/linuxserver/baseimage-debian:bookworm

RUN apt-get update && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash &&\
    apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs

WORKDIR /opt/mcsmanager/web

COPY --from=builder /src/production-code/web/ /opt/mcsmanager/web/

COPY dockerfile/web/ /

EXPOSE 23333

VOLUME \
    /opt/mcsmanager/web/data \
    /opt/mcsmanager/web/logs
