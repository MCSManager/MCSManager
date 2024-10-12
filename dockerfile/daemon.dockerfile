FROM node:lts AS builder

WORKDIR /src
COPY . /src

RUN chmod a+x ./install-dependents.sh &&\
    chmod a+x ./build.sh &&\
    ./install-dependents.sh &&\
    ./build.sh

RUN wget --input-file=lib-urls.txt --directory-prefix=production-code/daemon/lib/

FROM node:lts

WORKDIR /opt/mcsmanager/daemon

COPY --from=builder /src/production-code/daemon/ /opt/mcsmanager/daemon/

RUN npm install --production

EXPOSE 24444

ENV MCSM_INSTANCES_BASE_PATH=/opt/mcsmanager/daemon/data/InstanceData

VOLUME ["/opt/mcsmanager/daemon/data", "/opt/mcsmanager/daemon/logs"]

CMD [ "app.js", "--max-old-space-size=8192" ]