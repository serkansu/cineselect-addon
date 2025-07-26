FROM node:18

# Uygulama dizini
WORKDIR /app

# package.json dosyasını kopyala ve bağımlılıkları yükle
COPY package.json ./
RUN npm install

# Tüm dosyaları kopyala
COPY . .

# HTTP portunu dışarı aç
EXPOSE 7010

# Uygulamayı başlat
CMD ["npm", "start"]
