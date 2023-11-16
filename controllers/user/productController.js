const { Category, Products, Cart, Coupens, User, Order, Wishlist } = require('../../models/DbConnection')
let { log } = require('console')
const productDb = require('./userDb');
const { createOrder } = require('../../models/razorpay');
const { contact } = require('./Otp')
const { ObjectId } = require('mongodb');

async function getShopProduct(filter, what) {
    try {
        if (what) {
            return await Products.find(what)
        } else {
            let product = await Category.aggregate([
                {
                    $unwind: "$products"
                },
                {
                    $match: {
                        "products.Cate": {
                            $in: [filter, "TOPNEW"]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        values: {
                            $push: "$products.prodId"
                        }
                    }
                }
            ]);

            if (product.length !== 0) {
                let sie = await Promise.all(product[0]?.values.map((item) => {
                    return Products.findById(item);
                }));
                return sie
            } else {
                return [];

            }
        }

    } catch (error) {
        console.error(error);
        return [];
    }
}


const searchProduct = async (req, res) => {
    try {
        let search = req.query.search
        let products; let active = false
        let filter = await productDb.priceDiff(await productDb.filterProducts('^' + search));
        req.session.MinMax = filter
        req.session.Search = search
        if (req.session.filterProducts) {
            active = req.session.activeFilter
            products = req.session.filterProducts
        } else {
            products = await productDb.searchedProducts(search)
        }
        res.render('user/productlist', { products, search, filter, active, userExist: (req.session.loggedIn) ? true : false })
    } catch (e) {
        res.redirect('/ERROR')
    }
}


const prodExplain = async (req, res) => {
    try {
        let product = await Products.findById(req.query.prodId)
        if (product !== null) {
            if (req.session.StockproductExplain) {
                req.session.StockproductExplain = false
                req.session.BUYNOW = false
                res.render('user/prodExplain', { product, userExist: (req.session.loggedIn) ? true : false, StockproductExplain: true })
            } else {
                res.render('user/prodExplain', { product, userExist: (req.session.loggedIn) ? true : false, StockproductExplain: false })
            }
        }
        else {
            res.redirect('/')
        }
    } catch (e) {
        res.redirect('/ERROR')
        console.error(e);
    }
}


let shopCollections = [
    {
        CategoryName: "Laptop",
        Image: "/img/shop01.png",
        sectionId: "laptopSection"
    }, {
        CategoryName: "Intel",
        Image: "/banner/Intel.png",
        sectionId: "processerSection"
    }, {
        CategoryName: "Ryzen",
        Image: "/banner/Ryzen.png",
        sectionId: "processerSection"
    }
]

const getShop = async (req, res) => {
    try {
        let newProductShop = await getShopProduct("NEWPRODUCT", false)
        let TopRating = await getShopProduct("TOPBRANDS", false)
        let PROCESSER = await getShopProduct(false, { Genre: "Processers" })
        let LAPTOP = await productDb.IntelProducts({ Genre: "Laptop" })

        log(LAPTOP)
        let Intel = await productDb.IntelProducts({ Brand: "INTEL" })
        let Ryzen = await productDb.IntelProducts({ Brand: "Ryzen" })
        let Laptop = await productDb.IntelProducts({ Genre: "Laptop" })

        Intel = productDb.divideArray(Intel, 3);
        Ryzen = productDb.divideArray(Ryzen, 3)
        Laptop = productDb.divideArray(Laptop, 3)

        log(Laptop[0][0].Genre)

        let userExist = (req.session.loggedIn) ? true : false
        res.render('user/shoppingPage', { shopCollections, TopRating, newProductShop, Intel, Ryzen, PROCESSER, Laptop, LAPTOP, userExist })
    } catch (e) {
        res.redirect('/ERROR')
    }
}



let filterProducts = async (req, res) => {
    try {
        let { filter } = req.query;
        let BeforeSearch = req.session.Search;
        req.session.activeFilter = filter
        let search = '^' + BeforeSearch;
        if (filter === 'MAX') {
            let splitedArr = req.session.MinMax[2].split('-')
            req.session.filterProducts = await findProductsByPrice(splitedArr[1], search, true)
        } else if (filter === 'MIN') {
            let splitedArr = req.session.MinMax[0].split('-')
            req.session.filterProducts = await findProductsByPrice(splitedArr[0], search, false)
        } else {
            let arr = filter.split('-');
            search = String(search);
            req.session.filterProducts = await Products.find({
                $and: [
                    {
                        $or: [
                            { Name: { $regex: search, $options: 'i' } },
                            { Brand: { $regex: search, $options: 'i' } },
                            { Genre: { $regex: search, $options: 'i' } }
                        ]
                    },
                    {
                        Price: { $gte: Number(arr[0]), $lte: Number(arr[1]) }
                    }
                ]
            });
        }
        res.redirect('/search?search=' + BeforeSearch);
    } catch (e) {
        error(e)
    }
};


async function findProductsByPrice(price, search, MAX) {
    try {
        let filter = (MAX) ? { $gte: price } : { $lte: price }
        return await Products.find({
            $and: [
                {
                    $or: [
                        { Name: { $regex: search, $options: 'i' } },
                        { Brand: { $regex: search, $options: 'i' } },
                        { Genre: { $regex: search, $options: 'i' } }
                    ]
                },
                {
                    Price: filter
                }
            ]
        });
    } catch (e) {
        console.error(e);
    }
}



const getWishList = async (req, res) => {
    try {

        const userId = req.session.userId
        let wishlist = await Wishlist.aggregate([{
            $match: {
                userId: userId
            }
        }, {
            $unwind: "$Products"
        }, {
            $lookup: {
                from: 'products',
                localField: 'Products',
                foreignField: '_id',
                as: 'Details'
            }
        }])
        let response = await Cart.findOne({ userId: req.session.userId });

        wishlist.map(async (item, index) => {
            wishlist[index].inCart = false;
            try {
                response.Products.map((cartProdId) => {
                    if (cartProdId.prodId + "" === item.Products + "") {
                        wishlist[index].inCart = true;
                    }
                })
            } catch (e) {
                console.error('Error while updating wishlist:', error);
            }
        })

        let Total = 10000
        let Discount = -1000
        let grantTotal = 39000
        res.render('user/wishList', { wishlist, Discount, Total, grantTotal, userId })
    } catch (e) {
        res.redirect('/ERROR')
    }
}


const addToWishlist = async (req, res) => {
    const userId = req.session.userId
    const productId = new ObjectId(req.query.prodId); // Example user ID
    try {
        let wishlist = await Wishlist.findOne({ userId });
        if (wishlist) {
            if (wishlist.Products.includes(productId)) {
                return res.status(202).json({ status: true });
            } else {
                wishlist.Products.addToSet(productId);
                await wishlist.save();
            }
        } else {
            wishlist = new Wishlist({
                userId: userId,
                Products: [new ObjectId(req.query.prodId)]
            });
            await wishlist.save();
        }
        res.status(200).json({ status: true, message: 'Product added to the wishlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding the product to the wishlist' });
    }
};

const moreDetails = async (req, res) => {
    const proId = req.query.proId;
    try {
        const product = await Products.findById(proId);
        if (product) {
            res.status(200).json({ product });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



let clearWishList = async (req, res) => {
    await Wishlist.findOneAndUpdate({ userId: req.query.userId }, {
        $set: {
            Products: []
        }
    })
    res.redirect('/getwishList')
}


const deleteFromWishlist = async (req, res) => {
    try {
        log(req.query.prodId);
        let wlt = await Wishlist.findOne({ userId: req.session.userId });
        wlt.Products = wlt.Products.filter(item => item.toString() !== req.query.prodId);
        await wlt.save();
        log(wlt);
        res.redirect('/getwishList');
    } catch (e) {
        console.error(e);
        res.redirect('/ERROR');
    }
};

const contactFormSubmit = async (req, res) => {
    try {
        contact(req.body)
        res.redirect('/')
    } catch (e) {
        res.redirect('/ERROR')
    }
}

module.exports = {
    searchProduct, prodExplain, getShop, filterProducts, addToWishlist, getWishList, moreDetails,
    clearWishList, deleteFromWishlist, contactFormSubmit
}