ARG BUILDPLATFORM=linux/amd64
FROM --platform=${BUILDPLATFORM} node:lts-alpine AS builder

WORKDIR /src
COPY . /src

RUN chmod a+x ./install-dependents.sh &&\
    chmod a+x ./build.sh &&\
    ./install-dependents.sh &&\
    ./build.sh

FROM ghcr.io/linuxserver/baseimage-alpine:edge

RUN apk add --no-cache \
    nodejs \
    npm

COPY --from=builder /src/production-code/web/ /opt/mcsmanager/web/

COPY dockerfile/web/ /

EXPOSE 23333

VOLUME ["/opt/mcsmanager/web/data", "/opt/mcsmanager/web/logs"]
