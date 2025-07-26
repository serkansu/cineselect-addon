FROM node:18

# Add working directory
WORKDIR /app

# Copy files
COPY package*.json ./
COPY index.js ./
COPY favorites.json ./

# Install dependencies
RUN npm install

# Expose the port your addon will run on
EXPOSE 7010

# Start the addon
CMD ["node", "index.js"]
