const session = require('express-session')
const bcrypt = require('bcrypt')
const adminDb = require('./adminDb')
const fs = require('fs')
const { sendOtp } = require('../user/Otp')
const { log } = require('console')
const { Category, Products } = require('../../models/DbConnection')
const { ObjectId } = require('mongodb')

function getCategory(category, products) {
    products.map((item, index) => {
        category.products.map((value, i) => {
            if (value?.prodId + "" === item._id + "") {
                log(value.Cate)
                if (value?.Cate === "NEWPRODUCT") {
                    if (item?.cat === "TOPBRANDS") {
                        products[index].cat = "TOPNEW"
                    } else {
                        products[index].cat = "NEWPRODUCT"
                    }
                } else if (value?.Cate === "TOPBRANDS") {
                    log("Top brands aanu tta")
                    if (item?.cat === "NEWPRODUCT") {
                        products[index].cat = "TOPNEW"
                    } else {
                        products[index].cat = "TOPBRANDS"
                    }
                } else {
                    products[index].cat = value.Cate
                }
            }
        })
    })
    return products
}


let getCategoryManagement = async (req, res) => {
    try {
        let skip = (req.session?.skipCategory)?req.session.skipCategory:0
        skip = (skip<0)?0:skip
        let products = await Products.find({deleted:false}).skip(skip).limit(10)
        let category = await Category.findOne();
        products = getCategory(category, products)

        let currentPage = 1; let active1 = 'active';
        let active2 = ''; let active3 = ''; let sl = skip+1;
        
        res.render('admin/categoryManagement', {  products, currentPage, active1, active2, active3, sl });
    } catch (error) {

        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



let addCategory = async (req, res) => {
    let { Category, Brands } = req.body
    await adminDb.addCategory(Category, Brands)
    res.redirect('category-Management')
}


let brandDelete = async (req, res) => {
    let { category, Brand } = req.query
    await adminDb.deleteAllProduct(category, Brand)
    let status = await adminDb.brandDelete(category, Brand)
    res.redirect('category-Management')

}

let addBrand = async (req, res) => {
    let { Categories, Brand } = req.body
    await adminDb.addBrand(Categories, Brand)
    res.redirect('category-Management')
}


let checkPasswordDel = async (req, res) => {
    try {
        let detials = await adminDb.userDetials(2520)
        let { password, category } = req.query
        if (await bcrypt.compare(password, detials.Password)) {
            await adminDb.deleteCategory(category)
            res.redirect('category-Management')
        } else {
            res.redirect('category-Management')
        }
    } catch (err) {
        console.error(err);
    }
}


let updateBrand = (req, res) => {
    const fieldNames = Object.keys(req.body);
    fieldNames.map(async (string) => {
        const [Category, Brands] = string.split("-");
        await adminDb.changeBrands(Category, Brands, req.body[string])
    })
    res.redirect('category-Management',)
}


let addTopBrands = async (req, res) => {
    try {
        log(req.query.to)
        let newCat = (req.query.to === "true") ? "TOPBRANDS" : "NEWPRODUCT"
        let cat = await Category.findOne()
        let ind = false
        cat.products.map((item, index) => {
            console.log(item);
            if (item?.prodId + "" === req.query.prodId) {
                ind = index
                cat.products[index].Cate = "TOPNEW"
            }
        })
        if (ind === false) {
            const pro = await Products.findById(req.query.prodId)
            cat.products.push({
                Cate: newCat,
                prodId: pro._id,
                proName: pro.Name
            })
        }
        await cat.save()
        res.redirect('category-Management')
    } catch (error) {
        
        console.error(error);
        res.redirect('/ERROR')
    }
};

let DeleteCategory = async (req, res) => {
    try {
        if (req.query.from === "TOPBRANDS" || req.query.from === "NEWPRODUCT" || req.query.from === "TOPNEW") {
            let cat = await Category.findOne();
            
            cat.products = cat.products.filter((item) => {
                if (item?.prodId + "" === req.query.prodId + "") {

                    if (item.Cate === "TOPNEW") {
                        item.Cate = (req.query.from === "TOPBRANDS") ? "NEWPRODUCT" : "TOPBRANDS";
                        return true;
                    } else if (item.Cate === "TOPBRANDS" || item.Cate === "NEWPRODUCT") { 
                        return false;
                    }
                }
                return true;
            });

            await cat.save();
        }
        res.redirect('category-Management');
    } catch (e) {
        console.error(e);
        res.redirect('/ERROR');
    }
}


let pageNumberCategory = (req, res) => {
    if (req.query?.currentPage) {
        req.session.skipCategory = Number(req.query?.currentPage) + Number(req.query.inc)
        res.redirect('category-Management')
    } else {
        req.session.skipCategory = (Number(req.query.no) * 10) -10
        res.redirect('category-Management')
    }
}

let changeDetailsInCategory = async (Data) => {
    await Category.findOneAndUpdate({ id: Data.id }, {
        $set: {
            ProductName: Data.Name,
            Price: Data.Price,

        }
    })
}

let ChangeImageInCategory = async (image, id) => {
    await Category.findOneAndUpdate({ id: id }, {
        $set: {
            productImage: image
        }
    })
}

module.exports = {
    getCategoryManagement, addCategory, brandDelete, addBrand, checkPasswordDel, ChangeImageInCategory,
    updateBrand, DeleteCategory, addTopBrands, pageNumberCategory, changeDetailsInCategory
}