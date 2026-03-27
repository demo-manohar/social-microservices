# Dockerfile for the API Gateway 
# what is dockerfile?
# Dockerfile is a script that contains the instructions for building a Docker image.
# It is used to create a Docker image that can be used to run a container.
# It is a text file that contains the instructions for building a Docker image.
# It is used to create a Docker image that can be used to run a container.
# what is docker?
# Docker is a containerization platform that allows you to package your application with all its dependencies into a container.
# It is a tool that allows you to create, deploy, and run applications by using containers.
# It is a platform that allows you to create, deploy, and run applications by using containers.
# what is a container?
# A container is a standard unit of software that packages up code and dependencies so the application runs quickly and reliably from one computing environment to another.
# what is a container image?
# A container image is a read-only template that contains a set of instructions for creating a container.
# It is used to create a Docker image that can be used to run a container.
# what is a container registry?
# A container registry is a repository for storing container images.
# what is docker image?
# A docker image is a read-only template that contains a set of instructions for creating a container.
# It is used to create a Docker image that can be used to run a container.
# what is docker container?
# A docker container is a running instance of a Docker image.
# It is used to run a Docker image that can be used to run a container.
# what is docker compose?
# Docker Compose is a tool for defining and running multi-container Docker applications.
# It is used to create, deploy, and run applications by using containers.
# what is docker swarm?
# Docker Swarm is a tool for managing a cluster of Docker nodes.
# It is used to create, deploy, and run applications by using containers.
use the official node.js 18 image with alpine linux as the base image

# create a docker image for the api gateway
FROM node:18-alpine

# set the working directory in the container
WORKDIR /use/src/app

# copy the package.json file to the container
COPY package*.json ./
# install the dependencies only for production
RUN npm ci --only=production

# copy the source code to the container
COPY . .

# expose the port 3000
EXPOSE 3000

# start the application in production mode
CMD ["node", "src/server.js"]





