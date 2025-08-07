# Start with an official, lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first.
# This takes advantage of Docker's layer caching, so 'npm install'
# only runs when your dependencies change, not every time you change a code file.
COPY package*.json ./

# Install the application's dependencies
RUN npm install

# Copy the rest of your application's source code into the container
COPY . .

# Expose the port that your app runs on
EXPOSE 3003

# Define the command to run your application
CMD [ "node", "index.js" ]