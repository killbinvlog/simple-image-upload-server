# SimpleImageUploadServer

I coded this simple image upload server for me at the beginning today I make it available on github, it's very basic you can add an image with a POST request and get the image with a GET request. This code stores the images on a MongoDB database. The id of the images are represented by their respective hash (hash in MD5). I have provided in the files a file recognized by ShareX which allows to configure the server with ShareX, a screen capture software (so ShareX sends the screenshots on the server).

## How to start using it?

### Create a MongoDB database

You can get one for free at MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
I'm not going to make a tutorial to create a MongoDB server but you'll need one to run the code.

### Configure the server

In the list of files, there is a file called `exemple.env`. You will have to modify it and change some values in it.

1. `MONGODB_URI=mongodb+srv://...` The value `MONGODB_URI` must be equal to your mongodb connection url (https://docs.mongodb.com/manual/reference/connection-string/)
2. `API_TOKEN=YOUR_SECRET` The value `API_TOKEN` can be set to anything but it is a key that will allow images to be sent to your server, the best is to keep it secret.
3. `PORT=80` You don't have to change it, it is the port of your server.

**Once you are done, you need to rename the `example.env` file to `.env` so that it is recognizable in the code.**

### Set up the ShareX configuration file (Optional only if you want to use ShareX with it)

You will need to change the configuration of the `ShareX_Conf.sxcu` file.

1. Replace `https://www.exemple.com` with your own host name on lines `4` and `9`.
2. Replace `YOUR_SECRET` with the secret key you previously configured in the `.env` file.
3. Replace the `Name` value if you want, you can put whatever you want 😉

If you have ShareX installed on your computer you can run this file with ShareX and it will configure the server!

### Change the default 404 (Not found) image (Optional)

***You can change the 404 image very easily, just change the image `404.png` in the main directory! If you change the file extension don't forget to change it in the `server.js` code.***


      
