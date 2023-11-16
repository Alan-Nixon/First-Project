const { default: mongoose } = require('mongoose')
const { Category, Banner } = require('../../models/DbConnection')
const adminDb = require('./adminDb')
const fs = require('fs')
const { log } = require('console')


let getBannerManagement = async (req, res) => {
    let banner = await adminDb.getBanner()
    let AboutUs = await adminDb.getAboutUs()
    let logo = await Category.findOne({ Categories: { $exists: false } })
    res.render('admin/bannerManagement', { banner, AboutUs, logo })
}

let changeBannerDetails = async (req, res) => {
    await adminDb.updateBanner(req.body)
    res.redirect('banner-Management')
}


let bannerCreate = async (req, res) => {
    req.body.bannerImage = `/banner/${req.body.CoverImage}`
    req.body.Active = ""
    req.body.Banner = true
    await Banner.insertMany(req.body)
    res.redirect('banner-Management')
}

let deleteBanner = async (req, res) => {
    let imagePath = 'public' + req.query.bannerImage
    if (fs.existsSync(imagePath)) { fs.unlinkSync(imagePath); }
    await Banner.findByIdAndDelete(req.query.id)
    res.redirect('banner-Management')
}

let editBannerImage = async (req, res) => {
    let CoverImage = '/banner/' + req.body.CoverImage
    await Banner.findByIdAndUpdate(req.body.id, {
        $set: {
            bannerImage: CoverImage
        }
    })
    res.redirect('banner-Management')
}

let UpdateAboutSection = async (req, res) => {
    await Banner.findOneAndUpdate({ Banner: false }, {
        $set: {
            Heading: req.body.Heading,
            Description: req.body.Description
        }
    })
    res.redirect('banner-Management')
}

let changeImageAboutUs = async (req, res) => {
    let CoverImage = '/banner/' + req.body.CoverImage
    let imagePath = 'public' + req.body.oldImage
    if (fs.existsSync(imagePath)) { fs.unlinkSync(imagePath); }
    await Banner.findOneAndUpdate({ Banner: false }, {
        $set: {
            bannerImage: CoverImage
        }
    })
    res.redirect('banner-Management')
}   

let cancelActive = async (req, res) => {
    try {
        
        log(req.query.bannerId)
        await Banner.findByIdAndUpdate(req.query.bannerId, {
            $set: {
                Active: 'active'
            }
        });

        await Banner.updateMany({
            Banner: true,
            _id: { $ne: new mongoose.Types.ObjectId(req.query.bannerId) }
        }, {
            $set: {
                Active: ''
            }
        });
    } catch (e) {
        res.redirect('/ERROR')
        console.error(e);
    }
}

module.exports = {
    getBannerManagement, changeBannerDetails, bannerCreate, deleteBanner, editBannerImage,
    UpdateAboutSection, changeImageAboutUs, cancelActive
}