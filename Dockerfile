FROM node:18

# Uygulama dizini
WORKDIR /app

# Sadece package.json kopyala
COPY package.json ./

# Bağımlılıkları yükle
RUN npm install

# Diğer tüm dosyaları kopyala (lock dosyası artık olmadığı için sorun yok)
COPY . .

# Portu aç
EXPOSE 7010

# Uygulamayı başlat
CMD ["npm", "start"]
