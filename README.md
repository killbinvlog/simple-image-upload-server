# Simple image upload server

Web server made with ExpressJS on NodeJS that allows the uploading, storing and getting images. It stores the images and their information with a MongoDB server. It was created to allow me to send images online easily.

## How to start it?

### With Docker 🐳 (easiest way)

#### Prerequisites

- Docker installed on your host

#### 1) Duplicate the `config.example.js` file and name it `config.js`.

#### 2) Do the same with the `example.env` file and name it `.env`.

#### 3) Configure the server as you want (optional but recommended).

> You just need to modify the `config.js` and `.env` files (almost every setting are described with comments in files).

#### 5) Open a terminal at the root of the project.

#### 6) Run the command `docker compose up` in your terminal to start a MongoDB server and an instance of the image upload server.

### Without Docker

#### Prerequisites

- NodeJS v16.15.0 (this is the version I use but another one could work well) with npm
- A running MongoDB server (you can get one for free at MongoDB Atlas => https://www.mongodb.com/cloud/atlas)

#### 1) Duplicate the `config.example.js` file and name it `config.js`.

#### 2) Do the same with the `example.env` file and name it `.env`.

#### 3) Modify the MONGODB_URI in `.env` file with your MongoDB connection string (more information in the file).

#### 4) Configure the server as you want (optional but recommended).

> You just need to modify the `config.js` and `.env` files (almost every setting are described with comments in files).

#### 5) Open a terminal at the root of the project.

#### 6) Run the command `npm install` in your terminal to install npm packages (once this is done, you will not need to do it anymore).

#### 7) Run the command `npm start` in your terminal to start the server.

## How to use it?

Personally I use ShareX to take my screenshots, if this is your case you can simply modify the `ShareX.sxcu` file with the information that is in the server configuration (see section below) and then import this file into the ShareX program. Unfortunately, ShareX is a program only available on Windows for those who do not use ShareX you can try to find out how to use a custom image upload server in your program settings, if this is impossible you can always try to make a script to automate the uploading of images to the server yourself.

### Configure the `ShareX.sxcu` file.

1. Replace "https://www.example.com" with your own url.
2. Replace "YOUR_SECRET" with the secret key that you can find in the `.env` file (`API_TOKEN` value).
3. Replace the `Name` value if you want, you can put whatever you want.

## Need some help?

If you need help, I can help you just contact me on **Discord** or by **Email**.
