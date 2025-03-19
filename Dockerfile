FROM node:22

# workdir
WORKDIR /app

# copy files
COPY package*.json ./

# install dependencies
RUN npm install

# copy rest of the file
COPY . .

# expose port
EXPOSE 3002


# start app
CMD ["npm", "start"]
