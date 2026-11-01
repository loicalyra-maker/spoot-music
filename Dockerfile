# Spoot Music — Production 24/7 Cloud Container (Dockerfile)
# Runs 24/7 on Render / Koyeb / Railway / Docker without needing a local PC.
FROM node:22-alpine

# Install Python 3, pip, ffmpeg, git, curl + symlinks
RUN apk add --no-cache python3 py3-pip ffmpeg git curl \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && ln -sf /usr/local/bin/node /usr/bin/node

# Install yt-dlp + PO token provider plugin for bot bypass
RUN pip install --no-cache-dir --break-system-packages -U yt-dlp bgutil-ytdlp-pot-provider

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source code
COPY . .

# Build Vite production frontend (into dist/)
RUN npm run build

# Production port
ENV PORT=5173
EXPOSE 5173

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5173/healthz || exit 1

# Start the production server
CMD ["node", "server.mjs"]
