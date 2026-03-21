const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Log into your specific Cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configure where the files should go
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tripcircle_vault', // This will create a neat folder in your Cloudinary dashboard!
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] // Accept images and tickets
  },
});

// 3. Create the middleware catcher
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };