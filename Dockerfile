FROM node:18

# Add working directory
WORKDIR /app

# Copy only package.json
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Expose the port your addon will run on
EXPOSE 7010

# Start the addon
CMD ["node", "index.js"]
