# Simple image upload server

Web server made with ExpressJS on NodeJS that allows to upload, store and get images. It stores the images and their information with a MongoDB server. It was created to allow me to send images online easily.

## Table of contents

- [How to start it?](#how-to-start-it)
  - [With Docker](#with-docker-🐳-easiest-way)
    - [Prerequisites](#prerequisites)
    - [Steps](#steps)
  - [Without Docker](#without-docker)
    - [Prerequisites](#prerequisites-1)
    - [Steps](#steps-1)
  - [Check if the server is running](#check-if-the-server-is-running)
- [How to use it?](#how-to-use-it)
  - [Configure the `ShareX.sxcu` file.](#configure-the-sharexsxcu-file)
- [Need some help?](#need-some-help)

## How to start it?

### With Docker 🐳 (easiest way)

#### Prerequisites

- Docker installed on your host

#### Steps

1. Duplicate the `config.example.js` file and name it `config.js`.

2. Do the same with the `example.env` file and name it `.env`.

3. Configure the server as you want (optional but recommended).

   > You just need to modify the `config.js` and `.env` files (almost every setting are described with comments in files).

4. Open a terminal at the root of the project.

5. Run the command `docker compose up` in your terminal to start a MongoDB server and an instance of the image upload server.

### Without Docker

#### Prerequisites

- NodeJS v16.15.0 (this is the version I use but another one could work well) with npm
- A running MongoDB server (you can get one for free at MongoDB Atlas => https://www.mongodb.com/cloud/atlas)

#### Steps

1. Duplicate the `config.example.js` file and name it `config.js`.

2. Do the same with the `example.env` file and name it `.env`.

3. Modify the `MONGODB_URI` value in the `.env` file with your MongoDB connection string (more information in the file).

4. Configure the server as you want (optional but recommended).

   > You just need to modify the `config.js` and `.env` files (almost every setting are described with comments in files).

5. Open a terminal at the root of the project.

6. Run the command `npm install` in your terminal to install npm packages (once this is done, you will not need to do it anymore).

7. Run the command `npm start` in your terminal to start the server.

### Check if the server is running

Normally, if you have not changed the server configuration, the server runs on `http://localhost:5001` and you will see: "Cannot GET /" on the page.

## How to use it?

Personally I use ShareX to take my screenshots, if this is your case you can simply modify the `ShareX.sxcu` file with the information that is in the server configuration (see section below) and then import this file into the ShareX program. Unfortunately, ShareX is a program only available on Windows for those who do not use ShareX you can try to find out how to use a custom image upload server in your program settings, if this is impossible you can always try to make a script to automate the uploading of images to the server yourself.

### Configure the `ShareX.sxcu` file.

1. Replace "https://www.example.com" with your own url.
2. Replace "YOUR_SECRET" with the secret key that you can find in the `.env` file (`API_TOKEN` value).
3. Replace the `Name` value if you want, you can put whatever you want.

## Need some help?

If you need help, I can help you just contact me, my contact information is filled in the README of my profile.
