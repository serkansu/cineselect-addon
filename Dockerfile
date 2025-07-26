FROM node:18

WORKDIR /app

# Tüm dosyaları kopyala
COPY . .

# Bağımlılıkları yükle
RUN npm install

# Portu aç
EXPOSE 7010

# Başlat
CMD ["node", "index.js"]
