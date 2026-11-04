ARG BUILDPLATFORM=linux/amd64
FROM --platform=${BUILDPLATFORM} node:22-alpine AS builder

WORKDIR /src
COPY . /src

RUN chmod a+x ./install-dependents.sh &&\
    chmod a+x ./build.sh &&\
    ./install-dependents.sh &&\
    ./build.sh

FROM node:22-alpine

WORKDIR /opt/mcsmanager/web

COPY --from=builder /src/production-code/web/ /opt/mcsmanager/web/

# build.sh uses BUNDLE=1; runtime dependencies are already inside app.js.
RUN test -f app.js && test ! -e node_modules

EXPOSE 23333

VOLUME ["/opt/mcsmanager/web/data", "/opt/mcsmanager/web/logs"]

CMD [ "app.js", "--max-old-space-size=8192" ]
