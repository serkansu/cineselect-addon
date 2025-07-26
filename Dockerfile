FROM node:18

# Uygulama dizini
WORKDIR /app

# Sadece package.json kopyalanıyor
COPY package.json ./

# Bağımlılıkları yükle
RUN npm install

# Geri kalan tüm dosyaları kopyala
COPY . .

# Portu aç
EXPOSE 7010

# Uygulamayı başlat
CMD ["npm", "start"]
