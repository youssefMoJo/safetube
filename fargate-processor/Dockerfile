FROM node:18

# Install yt-dlp and ffmpeg (with override flag)
RUN apt-get update && apt-get install -y ffmpeg python3-pip && pip3 install yt-dlp --break-system-packages

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN ls -la /app/cookies.txt

CMD ["node", "processor.js"]