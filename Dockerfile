FROM node:latest@sha256:f90e576f924bd8250a5b17923e7879e93abac1991ad6053674aa1bbdcfd7a714

ENV NODE_OPTIONS=--openssl-legacy-provider

COPY . /app

RUN chown -R node:node /app
WORKDIR /app
USER node
