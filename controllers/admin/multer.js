let multer = require('multer')
let sharp = require('sharp')


let plusUnique = Math.floor(Math.random() * 1000 ** 4)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImages');
    },
    filename: (req, file, cb) => {
        try {
            let filename = 'COVER' + Date.now() + plusUnique + ".png";
            cb(null, filename);
            console.log('succesfully inserted image ');
            req.body.CoverImage = filename
        } catch (err) {
            console.error('Error saving image:', err);
            cb(err);
        }
    },
});

const MULTISTORE = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImages');
    },
    filename: (req, file, cb) => {
        try {
            let filename = 'COVER' + Date.now() + ".png";
            cb(null, filename);
        } catch (err) {
            console.error('Error saving image:', err);
            cb(err);
        }
    },
});


const BannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/banner');
    },
    filename: (req, file, cb) => {
        try {
            let filename = 'COVER' + Date.now() + plusUnique + ".png";
            cb(null, filename);
            req.body.CoverImage = filename
        } catch (err) {
            console.error('Error saving image:', err);
            cb(err);
        }
    },
});


let uploadMultiple = multer({ storage: MULTISTORE })

let upload = multer({ storage: storage });

let bannerUpload = multer({ storage: BannerStorage })

module.exports = { upload, uploadMultiple, bannerUpload }   