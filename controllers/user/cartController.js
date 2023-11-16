const { Category, Products, Cart, Coupens, User, Order } = require('../../models/DbConnection')
const { log, error } = require('console')
const productDb = require('./userDb');


const FromCartcheckFunc = (req, res, next) => {
    if (req.session.fromCart || req.session.BUYNOW) {
        next()
    } else {
        res.redirect('/cart')
    }
}
async function IsStockFinished(cartId, prodId, inc, userId) {
    try {
        let cart = await Cart.findById(cartId);
        if (cartId === null) {
            cart = await Cart.findOne({ userId })
        }
        let index = -1;
        const product = await Products.findById(prodId);
        if (inc === 1260) {
            if (product.Stock < 1) { return true }
            log(prodId)
            index = cart?.Products.findIndex((item) => item.prodId.toString() === prodId);
            if (index !== -1) {
                log(index)
                if (cart?.Products[index].Quantity >= product.Stock && inc > 0) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false
            }
        } else {
            if (Array.isArray(prodId)) {
                for (const id of prodId) {
                    const product = await Products.findById(id);
                    index = cart.Products.findIndex((item) => item.prodId.toString() === id);

                    if (cart.Products[index].Quantity > product.Stock && inc > 0) {
                        return true;
                    }
                }
                return false;
            } else {

                index = cart.Products.findIndex((item) => item.prodId.toString() === prodId);
                if (index !== -1) {
                    log(index)
                    if (cart.Products[index].Quantity >= product.Stock && inc > 0) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false
                }

            }
        }
    } catch (e) {
        log(e)
        // res.redirect('/ERROR')
    }

}


async function incCartItem(cartId, prodId, inc) {
    try {
        if (await IsStockFinished(cartId, prodId, inc)) { return false }
        else {
            return await Cart.findOneAndUpdate(
                {
                    _id: cartId,
                    'Products.prodId': prodId,
                },
                {
                    $inc: { 'Products.$.Quantity': inc },
                }, {
                new: true
            }
            );
        }

    } catch (e) {
        console.error(e);
    }
}


const getCart = async (req, res) => {
    try {
        let userid = req.session.userId
        let cartExistTrue = await Cart.findOne({ userId: userid })
        if (cartExistTrue && cartExistTrue.length !== 0) {
            req.session.fromCart = true
            let cart = await productDb.getCartProducts(userid)
            if (cart.length !== 0) {
                const Total = cart.reduce((accumulator, currentValue) => { return accumulator + currentValue.Total; }, 0);
                let Discount = (req.session.Discount) ? req.session.Discount : 0
                let grantTotal = Total - Discount - req.session.offer
                req.session.coupon = Discount
                req.session.Total = Total
                req.session.ProdNames = cart.map(item => { return item.Name })
                req.session.prodIds = cart.map(item => { return item._id })
                req.session.Quantity = cart.map(item => { return item.Quantity })
                let increasedStockErr = (req.session.increasedStockErr) ? req.session.increasedStockErr : false
                req.session.increasedStockErr = false
                res.render('user/cart', { cart, Total, Discount, grantTotal, userid, offer: req.session.offer, increasedStockErr })
            } else {
                let cart = []; let Total = null; let Discount = null; let grantTotal = null;
                res.render('user/cart', { cart, Total, Discount, grantTotal, userid, increasedStockErr: false })
            }
        } else {
            let cart = []; let Total = null; let Discount = null; let grantTotal = null;
            res.render('user/cart', { cart, Total, Discount, grantTotal, userid, offer: req.session.offer, increasedStockErr: false })
        }
    } catch (e) {
        error(e)
        res.redirect('/ERROR')
    }
}


const addToCart = async (req, res) => {
    try {
        let { prodId } = req.query;
        let { userId } = req.session;
        if (userId) {
            if (await IsStockFinished(null, prodId, 1260, req.session.userId)) {
                res.status(207).json()
            } else {
                let cart = await Cart.findOne({ userId: userId });
                if (cart) {
                    let Data = {
                        prodId: prodId,
                        Quantity: 1
                    };

                    let productExists = cart.Products.some(product => product.prodId + "" === prodId);
                    if (productExists) {
                        let flag = 0
                        cart.Products.map((product, index, array) => {
                            if (product.prodId + "" === prodId) {
                                if (product.Quantity === 10) {
                                    flag = 1
                                }
                            }
                        });
                        if (flag === 0) {
                            await Cart.updateOne(
                                { userId: userId, "Products.prodId": prodId },
                                { $inc: { "Products.$.Quantity": 1 } }
                            );
                        } else {
                            flag = 0;
                            return res.status(202).json({})
                        }

                    } else {
                        await Cart.findOneAndUpdate(
                            { userId: userId },
                            {
                                $addToSet: {
                                    Products: Data
                                }
                            }
                        );
                    }
                } else {
                    let NewInsert = {
                        userId: userId,
                        Products: [{
                            prodId: prodId,
                            Quantity: 1
                        }]
                    };
                    await Cart.insertMany(NewInsert);
                }
            }
            res.status(200).json()
        } else {
            res.status(208).json()
        }
    } catch (e) {
        error(e)
    }
}


const IncCartProduct = async (req, res) => {
    try {
        let { cartId, prodId, inc } = req.query
        let prod = await incCartItem(cartId, prodId, Number(inc));
        if (prod) {
            let Total = await productDb.getCartProducts(req.session.userId)
            Total = Total.reduce((accumulator, currentValue) => { return accumulator + currentValue.Total; }, 0);
            prod = prod.Products.find(product => product.prodId + "" === prodId)
            let { Price } = await Products.findById(prod.prodId, { _id: 0, Price: 1 })
            let Discount = (req.session.Discount) ? Total - req.session.Discount : Total
            let currentDiscount = (req.session.Discount) ? req.session.Discount : 0
            res.status(200).json({ status: true, prodTotal: prod.Quantity * Price, Total, Discount, currentDiscount })
        } else {
            res.status(201).json()
        }

    } catch (e) {
        res.redirect('/ERROR')
    }
}


const deleteProdFromCart = async (req, res) => {
    try {
        let { cartId, prodId } = req.query;
        let cart = await Cart.findById(cartId);
        cart.Products = cart.Products.filter(item => item.prodId + "" !== prodId);
        await cart.save();
        res.redirect('/cart')
    } catch (error) {
        res.redirect('/ERROR')
    }
};

const deleteCartComplete = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.query.userId })
        res.redirect('/cart')
    } catch (e) {
        res.redirect('/ERROR')
    }
}

const verifyCoupon = async (req, res, next) => {
    try {
        const cart = await productDb.getCartProducts(req.session.userId)
        req.session.offer = cart.reduce((acc, cur) => { return acc + cur.Offer }, 0);
        if (req.session.Discount == 0 || req.session.Discount === undefined) { next() } else {
            Total = cart.reduce((accumulator, currentValue) => { return accumulator + currentValue.Total; }, 0);
            log(Total, req.session.couponDetails.Min)
            if (Total < req.session.couponDetails.Min) {
                req.session.Discount = 0
                next()
            } else {
                req.session.Discount = (req.session.couponDetails.Discount * Total) / 100
                req.session.Discount = (req.session.couponDetails.Max < req.session.Discount) ? req.session.couponDetails.Max : req.session.Discount
                next()
            }
        }
    } catch (e) {
        res.redirect('/ERROR')
    }
}


const getCheckout = async (req, res) => {
    try {
        if (req.query.from === '$2b$10$knH5tRojZMENZ0qftczcX.cGLPd6wfR3Hx31V881PHxX7Z2XVCxp2') {
            let cart = await Cart.findOne({ userId: req.session.userId });
            if (req.session.BUYNOW) {
                const product = await Products.findById(req.session.prodIds)
                if (product.Stock < 1) {
                    req.session.StockproductExplain = true
                    return res.redirect('/productExplain?prodId=' + req.session.prodIds)
                }
            }
            if (await IsStockFinished(cart._id + "", req.session.prodIds, 2520) && !req.session.BUYNOW) {
                req.session.increasedStockErr = true
                return res.redirect('/cart')
            } else {
                let userid = req.session.userId
                let Total = req.session.Total
                let Discount = (req.session.coupon) ? req.session.coupon : 0
                let orderDetails = null
                if (req.session.BUYNOW) { orderDetails = req.session.BuyProductDetails }
                else { orderDetails = await productDb.getCartProducts(userid) }
                let DeliveryCharge = (req.session.Total > 50000) ? "Free delivery" : 50
                let grantTotal = (!isNaN(DeliveryCharge)) ? DeliveryCharge + Total : Total
                grantTotal -= Discount
                grantTotal -= req.session.offer
                req.session.TotalPrice = grantTotal
                req.session.DeliveryCharge = DeliveryCharge
                req.session.Discount = Number(Discount)
                let userDetails = await User.findById(userid)
                log("Total : " ,Total)
                let sendData = {
                    orderDetails, Total, DeliveryCharge, grantTotal, Discount,BUYNOW:(req.session.BUYNOW)?true:false,
                    userDetails, userid, prodIds: req.session.prodIds, offer: req.session.offer
                }
                return res.render('user/checkout', sendData)
            }

        } else {
            res.redirect('/cart')
        }
    } catch (e) {
        error(e)
        res.redirect('/ERROR')
    }

}

const removeDiscount = (req, res) => {
    try {
        req.session.Discount = 0
        res.redirect('/cart')
    } catch (e) {
        res.redirect('/ERROR')
    }
}


module.exports = {
    getCart, addToCart, IncCartProduct, deleteProdFromCart, deleteCartComplete, getCheckout,
    removeDiscount, verifyCoupon, FromCartcheckFunc
}