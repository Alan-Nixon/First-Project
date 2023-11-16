const { Products, Category } = require('../../models/DbConnection')
const adminDb = require('./adminDb')
const { log, error } = require('console')

async function getOfferFunc(filter) {
    let { Offers } = await Category.findOne(filter)
    return Offers
}

async function getGenreOffer(filter) {
    let { Offer } = await Products.findOne(filter)
    return Offer

}

async function FindMin(filter, Genre) {
    if (Genre) {
        let Min = await Products.aggregate([{ $match: filter }, { $group: { _id: null, min: { $min: "$Price" } } }])
        log(Min)
        return Min[0].min
    } else {
        let Min = await Category.aggregate([{ $match: filter }, { $group: { _id: null, min: { $min: "$Price" } } }])
        log(Min)
        return Min[0].min
    }

}
let getOfferManagement = async (req, res) => {
    req.session.skipProduct = (req.session?.skipProduct) ? req.session.skipProduct : 0
    let products = await adminDb.getProductPage(req.session.skipProduct)
    let currentPage = 0
    let active1 = 'active'; let active2 = ''; let active3 = ''
    res.render('admin/offerManagement', {
        products, currentPage, active3, active2, active1, 
    })
}

let addOffer = async (req, res) => {
    try {
        if (Number(req.query.price) > Number(req.query.offer)) {
            await Products.findByIdAndUpdate(req.query.prodId, {
                $set: {
                    Offer: Number(req.query.offer)
                }
            })

            let cat = await Category.findOne({ id: req.query.prodId })
            cat.Offers = Number(req.query.offer)
            cat.saleOffer = Number(req.query.offer)
            cat.DiscountedPrice = cat.Price - (Number(req.query.offer) * cat.Price) / 100
            await cat.save()
        }
    } catch (e) {
        console.error(e);
    } finally {
        res.redirect('offer-Management')
    }

}

let deleteOfferFrom = async (req, res) => {
    try {
        if (req.query.from === "TOP") {
            await Category.findOneAndUpdate({ TopBrands: true }, {
                $set: {
                    Offers: 0
                }
            })
        } else if (req.query.from === "NEW") {
            await Category.findOneAndUpdate({ NewProduct: true }, {
                $set: {
                    Offers: 0
                }
            })
        } else {
            await Products.findByIdAndUpdate(req.query.prodId, {
                $set: {
                    Offer: 0
                }
            })
        }

    } catch (e) {
        console.error(e);
    } finally {
        res.redirect('offer-Management')
    }
}

let addOfferCategory = async (req, res) => {
    try {
        if (req.query.top === 'true') {
            if (req.query.value < await FindMin({ TopBrands: true }, false) && req.query.value !== '' && !isNaN(req.query.value)) {
                await Category.updateMany({ TopBrands: true }, {
                    $set: {
                        Offers: req.query.value
                    }
                })
            }
        } else {
            if (req.query.value < await FindMin({ NewProduct: true }, false) && req.query.value !== '' && !isNaN(req.query.value)) {
                await Category.updateMany({ NewProduct: true }, {
                    $set: {
                        Offers: req.query.value
                    }
                })
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        res.redirect('offer-Management')
    }
}

let addOfferGenre = async (req, res) => {
    if (req.query.value < req.query.total && !isNaN(req.query.value) && !isNaN(req.query.total) && req.query.value !== '' && req.query.total !== '') {
        let filter = (req.query.from === "PROCESSER") ? { Genre: "Processers" } : { Genre: "Laptop" }
        await Products.findOneAndUpdate(filter, {
            $set: {
                Offer: req.query.value
            }
        })
    } else {
        log("else wiprmjknfjkl,knkjbd")
    }
    res.redirect('offer-Management')
}


let deleteGenreOffer = async (req, res) => {
    if (req.query.from === 'true') {
        await Products.updateMany({ Genre: "Processers" }, {
            $set: {
                Offer: 0
            }
        })
    } else {
        await Products.updateMany({ Genre: "Laptop" }, {
            $set: {
                Offer: 0
            }
        })
    }
    res.redirect('offer-Management')
}

module.exports = {
    getOfferManagement, addOffer, deleteOfferFrom, addOfferCategory, addOfferGenre, deleteGenreOffer
}