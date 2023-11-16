const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin/adminController')
const bannerController = require('../controllers/admin/bannerController')
const categoryController = require('../controllers/admin/categoryController')
const couponController = require('../controllers/admin/couponController')
const productController = require('../controllers/admin/productController')
const userController = require('../controllers/admin/userManageController')
const orderController = require('../controllers/admin/orderController')
const offerController = require('../controllers/admin/offerController')
const noCache = require('nocache')

let { upload, uploadMultiple, bannerUpload } = require('../controllers/admin/multer')
router.use(noCache())

router.get('/', controller.adminDashboard);
router.get('/login', controller.getLogin)
router.post('/login', controller.postLogin)
router.get('/logout', controller.logout)
router.get('/otpSend', controller.otpSend)
router.post('/otpSend', controller.verifyOtp)

router.get('/user-Managment', controller.verifyLogin, userController.getuserManagment)
router.get('/block', controller.verifyLogin, userController.blockUser)
router.post('/search', controller.verifyLogin, userController.searchUser)
router.get('/delete', controller.verifyLogin, userController.deleteUser)
router.get('/nextUserPage', controller.verifyLogin, userController.nextUserPage)

router.get('/product-Management',controller.verifyLogin,  controller.getProductManagement)
router.get('/deleteProduct', controller.verifyLogin, controller.deleteProduct)
router.post('/changeCoverImage',controller.verifyLogin, upload.single('imageCoverUpdate'), controller.changeCoverImage)
router.post('/createProduct',controller.verifyLogin,  upload.single('image'), controller.createProduct)
router.post('/addImagesOther', controller.verifyLogin, uploadMultiple.array('MultipleImages', 5), productController.updateProductImages)
router.post('/updateProduct',controller.verifyLogin,productController.updateProduct)
router.get('/stockINC', controller.verifyLogin, controller.stockINC)
router.post('/productSearch', controller.verifyLogin, controller.productSearch)
router.get('/getProDetails',controller.getProDetails)
router.get('/pageNumber', controller.verifyLogin, productController.pageNumber)
router.get('/deleteOtherImage', controller.verifyLogin, productController.deleteOtherImage)


router.get('/category-Management', controller.verifyLogin, categoryController.getCategoryManagement)
router.post('/addCategory', controller.verifyLogin, categoryController.addCategory)
router.get('/deleteCategory', controller.verifyLogin, categoryController.DeleteCategory)
router.get('/BrandDelete', controller.verifyLogin, categoryController.brandDelete)
router.post('/addBrand', controller.verifyLogin, categoryController.addBrand)
router.get('/checkPasswordDel', controller.verifyLogin, categoryController.checkPasswordDel)
router.post('/updateBrand', controller.verifyLogin, categoryController.updateBrand)
router.get('/addTopBrands', controller.verifyLogin, categoryController.addTopBrands)
router.get('/pageNumberCategory', controller.verifyLogin, categoryController.pageNumberCategory)

router.get('/banner-Management', controller.verifyLogin, bannerController.getBannerManagement)
router.post('/createBanner', controller.verifyLogin, bannerUpload.single('bannerImage'), bannerController.bannerCreate)
router.post('/updateMainBanner', controller.verifyLogin, bannerController.changeBannerDetails)
router.get('/deleteBanner', controller.verifyLogin, bannerController.deleteBanner)
router.post('/editBannerImage', controller.verifyLogin, bannerUpload.single('bannerImage'), bannerController.editBannerImage)
router.post('/UpdateAboutSection', controller.verifyLogin, bannerController.UpdateAboutSection)
router.post('/changeImageAboutUs', controller.verifyLogin, bannerUpload.single('AboutUsImage'), bannerController.changeImageAboutUs)
router.get('/cancelActive',controller.verifyLogin, bannerController.cancelActive)


router.get('/coupen-Management', controller.verifyLogin, couponController.getCoupenManagement)
router.post('/createCoupen', controller.verifyLogin, couponController.createNewCoupen)
router.get('/deleteCoupen', controller.verifyLogin, couponController.deleteCoupen)
router.get('/IncDate', controller.verifyLogin, couponController.IncDate)
router.post('/EditCoupen', controller.verifyLogin, couponController.EditCoupen)

router.get('/orderManagement', controller.verifyLogin, orderController.getOrderManagement)
router.get('/orderProductDetails', controller.verifyLogin, orderController.orderProductDetails)
router.get('/changeStatus',controller.verifyLogin, orderController.changeStatus)
router.get('/paginationOrder',controller.verifyLogin, orderController.paginationOrder)


router.get('/offer-Management',controller.verifyLogin,offerController.getOfferManagement)
router.get('/addOffer',controller.verifyLogin,offerController.addOffer)
router.get('/addOfferCategory',controller.verifyLogin,offerController.addOfferCategory)
router.get('/addOfferGenre',controller.verifyLogin,offerController.addOfferGenre)
router.get('/deleteGenreOffer',controller.verifyLogin,offerController.deleteGenreOffer)
router.get('/deleteOfferFrom',controller.verifyLogin,offerController.deleteOfferFrom)

module.exports = router;
