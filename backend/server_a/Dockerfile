# This is where you define the image for Server A.

# Use the official Node.js image from Docker Hub as the basis.
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the server will run on
EXPOSE 3000

# Command to run the server
CMD ["node", "index.js"]
