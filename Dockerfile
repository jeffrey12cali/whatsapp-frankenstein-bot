FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Update, upgrade, and install dependencies
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y \
      curl git gnupg2 ca-certificates build-essential pkg-config \
      libcairo2-dev libpango1.0-dev libpng-dev libgif-dev librsvg2-dev zlib1g-dev \
      libjpeg-dev python3 wget ffmpeg

# Install Node.js 22 from the official nodejs.org tarball.
# deb.nodesource.com serves 403 (S3 AccessDenied); its setup script also failed silently
# here, because `curl | bash` reports bash's status and apt then installed Ubuntu's
# nodejs without npm, so the build only broke later at `npm install`.
ENV NODE_VERSION=22.23.1
ENV NODE_SHA256=9749e988f437343b7fa832c69ded82a312e41a03116d766797ac14f6f9eee578
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
 && echo "${NODE_SHA256}  node-v${NODE_VERSION}-linux-x64.tar.xz" | sha256sum -c - \
 && tar -xJf "node-v${NODE_VERSION}-linux-x64.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
 && rm "node-v${NODE_VERSION}-linux-x64.tar.xz" \
 && node --version && npm --version

# Install Google Chrome stable
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update && apt-get install -y google-chrome-stable \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Download the latest yt-dlp binary from GitHub and move it to /usr/local/bin
RUN wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copy and install Node dependencies
# patches/ must land before npm install so the postinstall hook can apply it
COPY package*.json ./
COPY patches ./patches
RUN npm install

# Copy your app code
COPY . .

# logs/ is gitignored, so it is absent from clean checkouts
RUN mkdir -p /app/logs

# Prevent Node Module Version Errors
RUN npm rebuild --unsafe-perm

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["bash", "./run.sh"]

