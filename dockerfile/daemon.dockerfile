ARG BUILDPLATFORM=linux/amd64

FROM --platform=${BUILDPLATFORM} node:lts-alpine AS builder

WORKDIR /src
COPY . /src

RUN apk add --no-cache wget &&\
    chmod a+x ./install-dependents.sh &&\
    chmod a+x ./build.sh &&\
    ./install-dependents.sh &&\
    ./build.sh &&\
    wget --input-file=lib-urls.txt --directory-prefix=production-code/daemon/lib/ &&\
    chmod a+x production-code/daemon/lib/*

FROM ghcr.io/linuxserver/baseimage-alpine:edge

ARG EMBEDDED_JAVA_VERSION=21

RUN apk add --no-cache wget && \
    wget -O /etc/apk/keys/adoptium.rsa.pub https://packages.adoptium.net/artifactory/api/security/keypair/public/repositories/apk && \
    echo 'https://packages.adoptium.net/artifactory/apk/alpine/main' | tee -a /etc/apk/repositories && \
    apk add --no-cache \
    temurin-${EMBEDDED_JAVA_VERSION}-jdk \
    nodejs \
    npm

COPY --from=builder /src/production-code/daemon/ /opt/mcsmanager/daemon/

COPY dockerfile/daemon/ /

EXPOSE 24444

ENV MCSM_INSTANCES_BASE_PATH=/opt/mcsmanager/daemon/data/InstanceData

VOLUME ["/opt/mcsmanager/daemon/data", "/opt/mcsmanager/daemon/logs"]
