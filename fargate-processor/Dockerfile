FROM node:18

# Install yt-dlp and ffmpeg (with override flag)
RUN apt-get update && apt-get install -y ffmpeg python3-pip awscli && pip3 install yt-dlp --break-system-packages

WORKDIR /app

COPY package*.json ./
RUN npm install

CMD ["sh", "-c", "aws s3 cp s3://safetube-processor-code/processor.js /app/processor.js && node /app/processor.js"]