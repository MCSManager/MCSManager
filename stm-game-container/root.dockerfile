# This Dockerfile references:
# https://github.com/GSManagerXZ/Game_container/blob/main/Dockerfile
# https://hub.docker.com/r/cm2network/steamcmd/

FROM cm2network/steamcmd:root AS base

# /home/steam/steamcmd/steamcmd.sh 
ENV DEBIAN_FRONTEND=noninteractive \
    STEAM_USER=root \
    STEAM_HOME=/home/steam \
    STEAMCMD_DIR=/home/steam/steamcmd \
    DATA_DIR=/data

# Install SteamCMD and common dependencies (including 32-bit libraries)
RUN apt-get update \
    && dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        locales \
        wget \
        curl \
        jq \
        xdg-user-dirs \
        # Node.js related dependencies
        gnupg \
        # Python related dependencies
        python3 \
        python3-pip \
        python3-dev \
        python3-venv \
        # Game server dependencies
        libncurses6:i386 \
        libbz2-1.0:i386 \
        libicu-dev \
        libxml2:i386 \
        libstdc++6:i386 \
        lib32gcc-s1 \
        libc6-i386 \
        lib32stdc++6 \
        libcurl4-gnutls-dev:i386 \
        libcurl4-gnutls-dev \
        libgl1 \
        gcc-13-base:i386 \
        libssl3:i386 \
        libopenal1:i386 \
        libtinfo6:i386 \
        libtcmalloc-minimal4:i386 \
        # .NET and Mono related dependencies (required for ECO server, etc.)
        libgdiplus \
        libc6-dev \
        libasound2 \
        libpulse0 \
        libnss3 \
        libcap2 \
        libatk1.0-0 \
        libcairo2 \
        libcups2 \
        libgtk-3-0 \
        libgdk-pixbuf-2.0-0 \
        libpango-1.0-0 \
        libx11-6 \
        libxt6 \
        # Additional Unity game server dependencies (7 Days to Die, etc.)
        libsdl2-2.0-0:i386 \
        libsdl2-2.0-0 \
        libpulse0:i386 \
        libfontconfig1:i386 \
        libfontconfig1 \
        libudev1:i386 \
        libudev1 \
        libpugixml1v5 \
        libvulkan1 \
        libvulkan1:i386 \
        # Additional Unity engine dependencies (especially for 7 Days to Die)
        libatk1.0-0:i386 \
        libxcomposite1 \
        libxcomposite1:i386 \
        libxcursor1 \
        libxcursor1:i386 \
        libxrandr2 \
        libxrandr2:i386 \
        libxss1 \
        libxss1:i386 \
        libxtst6 \
        libxtst6:i386 \
        libxi6 \
        libxi6:i386 \
        libxkbfile1 \
        libxkbfile1:i386 \
        libasound2:i386 \
        libgtk-3-0:i386 \
        libdbus-1-3 \
        libdbus-1-3:i386 \
        # ARK: Survival Evolved server additional dependencies
        libelf1 \
        libelf1:i386 \
        libatomic1 \
        libatomic1:i386 \
        nano \
        net-tools \
        netcat-openbsd \
        procps \
        tar \
        unzip \
        bzip2 \
        xz-utils \
        zlib1g:i386 \
        fonts-wqy-zenhei \
        fonts-wqy-microhei \
        libc6 \
        libc6:i386 \
    && rm -rf /var/lib/apt/lists/*


# Create directory for mounting game data
VOLUME ["${DATA_DIR}"]

# Switch back to steam user
USER ${STEAM_USER}
WORKDIR ${DATA_DIR}
