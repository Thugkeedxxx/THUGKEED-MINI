# Use official Node 18 image
FROM node:18

# Install ffmpeg (needed for sticker creation)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Create tmp folder for stickers (if not exists)
RUN mkdir -p ./tmp

# Expose port if needed (optional)
# EXPOSE 3000

# Start the bot
CMD ["node", "index.js"]￼Enter
