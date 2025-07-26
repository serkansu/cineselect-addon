FROM node:18

# Çalışma klasörü
WORKDIR /app

# package.json ve package-lock.json’u kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Kalan tüm dosyaları kopyala
COPY . .

# Portu aç
EXPOSE 7010

# Uygulamayı başlat
CMD ["npm", "start"]
