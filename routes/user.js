const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController')
const prodController = require('../controllers/user/productController')
const orderController = require('../controllers/user/orderController')
const cartController = require('../controllers/user/cartController')
const noCache = require('nocache')
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.use(noCache())

// user controller
router.get('/', userController.IsBlocked, userController.Home);
router.get('/login', userController.getLogin)
router.post('/login', userController.loginOtpVerify)
router.get('/signup', userController.signUp)
router.post('/otpsignup', userController.generateOtp, userController.postLogin)
router.post('/EnteredOtp', userController.PostSignUp)
router.get('/profile', userController.IsBlocked, userController.loginVerify, userController.getProfile)
router.post('/profileImage', upload.single('image'), userController.profileImage)
router.get('/logout', userController.logout)
router.post('/updateDetials', userController.updateDetials)
router.get('/forgotPassword', userController.getForgetPassword)
router.post('/forgotPassword', userController.postForgetPassword)

router.get('/auth/google', userController.googleWindow)
router.get('/auth/google/callback', userController.googleCallback)
router.get('/success', userController.googleLoginSuccess)

// product controller
router.get('/shop', prodController.getShop)
router.get('/search', prodController.searchProduct)
router.get('/productExplain', prodController.prodExplain)
router.get('/filterProducts', prodController.filterProducts)
router.post('/contactFormSubmit', prodController.contactFormSubmit)

router.get('/getwishList', userController.IsBlocked, userController.loginVerify, prodController.getWishList)
router.get('/addToWishlist', userController.IsBlocked, userController.loginVerify, prodController.addToWishlist)
router.get('/moreDetails', userController.IsBlocked, userController.loginVerify, prodController.moreDetails)
router.get('/clearWishList', userController.IsBlocked, userController.loginVerify, prodController.clearWishList)
router.get('/wishToCart', userController.IsBlocked, userController.loginVerify, cartController.addToCart)
router.get('/deleteFromWishlist', userController.IsBlocked, userController.loginVerify, prodController.deleteFromWishlist)

// cart controller
router.get('/cart', userController.IsBlocked, userController.loginVerify, cartController.verifyCoupon, cartController.getCart)
router.get('/addToCart', userController.IsBlocked, userController.fetchLoginVerify, cartController.verifyCoupon, cartController.addToCart)
router.get('/IncCartProduct', userController.IsBlocked, userController.loginVerify, cartController.FromCartcheckFunc, cartController.verifyCoupon, cartController.IncCartProduct)
router.get('/deleteProcdFromCart', userController.IsBlocked, userController.loginVerify, cartController.FromCartcheckFunc, cartController.verifyCoupon, cartController.deleteProdFromCart)
router.get('/deleteCartComplete', userController.IsBlocked, userController.loginVerify, cartController.FromCartcheckFunc, cartController.deleteCartComplete)
router.get('/Checkout', userController.IsBlocked, userController.loginVerify, cartController.verifyCoupon, cartController.FromCartcheckFunc, cartController.getCheckout)
router.get('/removeDiscount', userController.IsBlocked, userController.loginVerify, cartController.verifyCoupon, cartController.removeDiscount)


//order controller
router.get('/orders', userController.IsBlocked, userController.loginVerify, orderController.getOrders)
router.post('/orderCreate', userController.IsBlocked, userController.loginVerify, orderController.orderCreate)
router.get('/getOrdersHistory', userController.IsBlocked, userController.loginVerify, orderController.getOrdersHistory)
router.get('/cancelOrder', userController.IsBlocked, userController.loginVerify, orderController.cancelOrder)
router.get('/thanksForOrdering', userController.IsBlocked, userController.loginVerify, cartController.FromCartcheckFunc, orderController.thanksForOrdering)
router.get('/FailedOrder', userController.IsBlocked, userController.loginVerify, cartController.FromCartcheckFunc, orderController.FailedOrder)
router.get('/reqForCancel', userController.IsBlocked, userController.loginVerify, orderController.reqForCancel)
router.get('/checkCoupon', userController.IsBlocked, userController.loginVerify, orderController.checkCoupon)
router.get('/buynow', userController.IsBlocked, userController.loginVerify, orderController.buynow)
router.get('/invoice', userController.IsBlocked, userController.loginVerify, orderController.invoice)


module.exports = router;
