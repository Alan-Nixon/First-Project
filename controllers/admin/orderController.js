const { Order, Coupens, User } = require("../../models/DbConnection")
const { log, error } = require('console')
const { decreaseStock } = require('../user/orderController')



let getOrderManagement = async (req, res) => {
    let orders = null; let pageno = 1; let active1 = 'active'; let active2 = ''; let active3 = ''; let currentPage = 1
    if (req.session.pageNoOrder) {
        currentPage = req.session.currentPage
        pageno = req.session.pageNoOrder + 1; if (pageno - 1 === 20) { active2 = 'active' }
        else if (pageno - 1 === 30) { active3 = 'active' }
        orders = await Order.find().sort({ OrderDate: 1 }).skip(req.session.pageNoOrder).limit(10)
        req.session.pageNoOrder = false
    } else {
        orders = await Order.find().sort({ OrderDate: -1 }).limit(10)
    }
    for (const order of orders) {
        const totalQuantity = order.Quantity.reduce(
            (accumulator, currentValue) => accumulator + currentValue,

        );
        order.TotalQuantity = totalQuantity;
    }
    req.session.orderArray = orders
    let coupons = await Coupens.find({}, { _id: 1, coupenName: 1 })
    res.render('admin/orderManagement', { orders, coupons, length: coupons.length, pageno, active1, active2, active3, currentPage })
}

const orderProductDetails = async (req, res) => {
    try {
        const data = await Order.findById(req.query.orderId);
        console.log(req.query, data);
        let statusCode = (req.query.user === 'true') ? 200 : 201
        res.status(statusCode).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching order product details.' });
    }
};

let changeStatus = async (req, res) => {
    try {
        await Order.findByIdAndUpdate(req.query.id, {
            $set: {
                Status: req.query.status
            }
        })
        if (req.query.status === "Canceled" || req.query.return === "RETURN") {
            let orderDetials = await Order.findById(req.query.id)
            if (orderDetials?.PaymentMethod !== "COD") {
                if (req.query.status === "Canceled") {
                    orderDetials.Canceled = true
                } else if (req.query.return === "RETURN") {
                    orderDetials.Returned = true
                }
                await User.findByIdAndUpdate(orderDetials.userId, {
                    $inc: {
                        Wallet: orderDetials.TotalPrice
                    }
                })
                let quantity = orderDetials.Quantity.map(element => -element)
                decreaseStock(orderDetials.prodId,quantity)
            }
            await orderDetials.save()
        }
        res.status(200).json()

    } catch (e) {
        console.error(e);
        res.redirect('/ERROR')
    }
}

const paginationOrder = async (req, res) => {

    if (req.query?.Inc === '1' || req.query?.Inc === '-1' && Number(req.query.currentPage) !== 1) {
        let currentPage = Number(req.query.currentPage)
        currentPage = currentPage + Number(req.query?.Inc)
        req.session.pageNoOrder = (currentPage - 1) * 10
        req.session.currentPage = currentPage
    } else if (req.query.pageNo !== '1') {
        req.session.currentPage = req.query.pageNo
        req.query.currentPage = req.query.currentPage
        req.session.pageNoOrder = (Number(req.query.pageNo) - 1) * 10
    }


    res.redirect('orderManagement')

}


module.exports = {
    getOrderManagement, orderProductDetails, changeStatus, paginationOrder
}