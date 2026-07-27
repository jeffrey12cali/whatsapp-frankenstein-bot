FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Update, upgrade, and install dependencies
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y \
      curl git gnupg2 ca-certificates build-essential pkg-config \
      libcairo2-dev libpango1.0-dev libpng-dev libgif-dev librsvg2-dev zlib1g-dev \
      libjpeg-dev python3 wget ffmpeg

# Install Node.js 22 (NodeSource)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get update && apt-get install -y nodejs

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

