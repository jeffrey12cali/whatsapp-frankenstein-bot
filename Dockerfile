# Use a Debian‑based Node image instead of Alpine for easier Chrome installation
FROM node:22-slim

# Install dependencies:
#  - wget and gnupg2 to download and add Google's signing key
#  - google-chrome-stable from Google's repository
#  - ffmpeg, python3, and python3-pip for ffmpeg and yt-dlp
RUN apt-get update && apt-get install -y \
      wget \
      gnupg2 && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && apt-get install -y \
      google-chrome-stable \
      ffmpeg \
      python3 \
      python3-pip && \
    pip3 install yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install node dependencies
COPY package*.json ./
RUN npm install

# Copy your app source code
COPY . .

# Expose port 3000 for your Node.js app
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

