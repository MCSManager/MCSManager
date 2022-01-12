FROM debian
COPY . /opt/MCSManager/
RUN apt update &&\
ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
apt install -y nodejs npm openjdk-17-jre docker.io && \
cd /opt/MCSManager/ && \
npm install