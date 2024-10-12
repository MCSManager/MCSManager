FROM node:lts AS builder

WORKDIR /src
COPY . /src

RUN chmod a+x ./install-dependents.sh &&\
    chmod a+x ./build.sh &&\
    ./install-dependents.sh &&\
    ./build.sh

FROM node:lts

WORKDIR /opt/mcsmanager/web

COPY --from=builder /src/production-code/web/ /opt/mcsmanager/web/

RUN npm install --production

EXPOSE 23333

VOLUME ["/opt/mcsmanager/web/data", "/opt/mcsmanager/web/logs"]

CMD [ "app.js", "--max-old-space-size=8192" ]
