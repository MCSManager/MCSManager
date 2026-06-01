ARG BUILDPLATFORM=linux/amd64
ARG EMBEDDED_JAVA_VERSION=21

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

FROM eclipse-temurin:${EMBEDDED_JAVA_VERSION} AS temurin-stage

FROM ghcr.io/linuxserver/baseimage-debian:trixie

ENV JAVA_HOME=/opt/java/openjdk
COPY --from=temurin-stage $JAVA_HOME $JAVA_HOME
ENV PATH="${JAVA_HOME}/bin:${PATH}"

RUN apt-get update && apt-get install -y curl &&\
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash &&\
    apt-get update && apt-get install -y nodejs && apt-get clean

COPY --from=builder /src/production-code/daemon/ /opt/mcsmanager/daemon/

COPY dockerfile/daemon/ /

EXPOSE 24444

ENV MCSM_INSTANCES_BASE_PATH=/opt/mcsmanager/daemon/data/InstanceData

VOLUME ["/opt/mcsmanager/daemon/data", "/opt/mcsmanager/daemon/logs"]
