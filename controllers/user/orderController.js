const { Category, Products, Cart, Coupens, User, Order } = require('../../models/DbConnection')
let { log, error } = require('console')
const { createOrder } = require('../../models/razorpay');
const { ObjectId } = require('mongodb');
const easyinvoice = require('easyinvoice')
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config()
const { Readable } = require('stream');

function getDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` + "";
}


let getOrders = async (req, res) => {
    let order = await Order.findById(req.query.id)
    if (order) {
        let products = await Promise.all(order.prodId.map(id => Products.findById(id)));
        let proValue = 20
        if (order.Status === "") { proValue = 20 }
        let OrderDetails = {
            _id: order._id,
            OrderDate: order.OrderDate,
            TotalPrice: order.TotalPrice,
            Quantity: order.Quantity,
            Status: order.Status,
            FullName: order.FullName,
            progressValue: proValue,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.PaymentMethod,
            Discount: order.Discount,
            DeliveryCharge: order.DeliveryCharge,
            SubTotal: order.SubTotal,
            AdminCancelReason: "",
            UserCancelReason: "",
            Returned: order.Returned,
            Canceled: order.Canceled
        }
        products = products.filter(product => product !== null);
        let progressPercentage = '60%'
        res.render('user/orders', { products, OrderDetails, progressPercentage })
    } else {
        res.redirect('/shop')
    }

}



const getOrdersHistory = async (req, res) => {
    try {
        const userId = (req.session?.userId) ? req.session.userId : false
        let OrdersHistory = []
        if (userId) { OrdersHistory = await Order.find({ userId: userId }).sort({OrderDate:-1}) }
        const userExist = (req.session.loggedIn) ? true : false
        res.render('user/orderHistory', { OrdersHistory, userExist })
    } catch (e) {
        res.redirect('/ERROR')
    }
}


let FailedOrder = async (req, res) => {
    await Order.findByIdAndDelete(req.query.orderId)
    res.status(200).json()
}


let checkCoupon = async (req, res) => {
    let { Total, coupon } = req.query
    let couponDetails = await Coupens.findOne({ coupenName: coupon })
    req.session.couponDetails = couponDetails
    if (couponDetails) {
        if (couponDetails.Min < Number(Total)) {
            if (new Date(couponDetails.ExpiryDate) > new Date()) {
                req.session.Discount = (couponDetails.Discount * Total) / 100
                res.status(200).json()
            } else {
                res.status(201).json()
            }
        } else {
            res.status(202).json()
        }
    } else {
        res.status(203).json()
    }
}


let cancelOrder = (req, res) => {
    try {
        Order.findByIdAndUpdate(req.query.id, {
            $set: {
                Cancel: true
            }
        }).then(() => res.redirect('/getOrdersHistory'))
    } catch (e) {
        error(e)
    }
}

async function checkCartDelete(userId) {
    await Cart.findOneAndUpdate({ userId }, {
        $set: { Products: [] }
    });
    console.log("here come !!!");
}

async function decreaseStock(prodIds, Quantities) {
    Promise.all(await prodIds.map((async (id, index) => {
        await Products.findByIdAndUpdate(id, {
            $inc: {
                Stock: -Quantities[index]
            }
        })
    })))
}

async function IsStockFinished(prodIds, Quantity) {
    let index = false
    prodIds.map(async (item, index) => {
        let product = await Products.findById(item)
        if (product.Stock < Quantity[index]) { index = true }
    })
    if (index) {
        return true
    } else {
        return false
    }

}


let orderCreate = async (req, res) => {
    try {
        req.body.prodId = req.body.prodId.split(',');
        req.body.userDetails.Pincode = Number(req.body.userDetails.Pincode);
        req.body.Quantity = req.session.Quantity
        req.body.ProdNames = req.session.ProdNames
        req.body.OrderDate = getDate()
        req.body.Discount = req.session.Discount
        req.body.DeliveryCharge = req.session.DeliveryCharge + ""
        req.body.SubTotal = req.session.Total
        req.body.FailedOrder = false
        req.body.TotalPrice = req.session.TotalPrice
        req.body.Status = "Pending";
        req.body.paymentStatus = "NOT PAID"
        req.body.UserCancelReason = ""
        req.body.Return = false
        req.body.Cancel = false
        req.body.Returned = false
        req.body.Canceled = false
        req.body.AdminCancelReason = ""
        if (await IsStockFinished(req.body.prodId, req.body.Quantity)) {

        } else {

            let Details = await Order.insertMany(req.body);
            if (req.body.PaymentMethod === "COD" || req.body.PaymentMethod === "WALLET") {
                if (req.body.PaymentMethod === "WALLET") {
                    let userDetails = await User.findById(Details[0].userId)
                    if (userDetails.Wallet < req.body.TotalPrice) {
                        await Order.findByIdAndDelete(Details[0]._id)
                        return res.status(408).json()
                    } else {
                        await User.findByIdAndUpdate(Details[0].userId, {
                            $inc: {
                                Wallet: -req.body.TotalPrice
                            }
                        })
                        if (!req.session?.BUYNOW) { checkCartDelete(req.body.userId) }
                        decreaseStock(Details[0].prodId, Details[0].Quantity)
                        pdfInvoice(Details[0]._id)
                        res.status(200).json({})
                    }
                }
                else if (req.body.PaymentMethod === "COD") {
                    await Order.findByIdAndUpdate(Details[0]._id, {
                        $set: {
                            Status: "Order Confirmed"
                        }
                    })
                    pdfInvoice(Details[0]._id); decreaseStock(Details[0].prodId, Details[0].Quantity)
                    if (!req.session?.BUYNOW) { checkCartDelete(req.body.userId) }
                    return res.status(200).json({ status: true });
                }
                req.session.BUYNOW = false
            } else {
                let order = {
                    orderId: Details[0]._id,
                    TotalPrice: Details[0].TotalPrice,
                    Notes: Details[0].Notes
                }
                createOrder(order).then((razOrder) => {
                    razOrder.userId = Details[0].userId
                    razOrder.prodId = Details[0].prodId
                    res.status(202).json(razOrder);
                }).catch(async (err) => {
                    await Order.findByIdAndDelete(Details[0]._id)
                    console.error(err)
                })
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



let thanksForOrdering = async (req, res) => {
    try {
        let { orderId, userId, prodId } = req.query
        prodId = prodId.split(',')
        let OrderDetails = await Order.findByIdAndUpdate(orderId, {
            $set: {
                paymentStatus: "PAID",
                Status: "Order Confirmed"
            }
        }, { new: true })

        if (!req.session.BUYNOW) {
            log("if worked")
            req.session.BUYNOW = false
        } else {
           log("else worked")
            checkCartDelete(userId)
        }
        decreaseStock(OrderDetails.prodId, OrderDetails.Quantity)
        req.session.BUYNOW = false
        req.session.fromCart = false
        pdfInvoice(orderId)
        res.render('user/ThanksPage')
    } catch (e) {
        res.redirect('/ERROR')
        error(e)
    }
}


let reqForCancel = async (req, res) => {
    if (req.query.From === "CANCEL") {
        await Order.findByIdAndUpdate(req.query.id, {
            $set: {
                UserCancelReason: req.query.reason,
                Cancel: true
            }
        })

        res.status(200).json({ status: true })
    } else {
        await Order.findByIdAndUpdate(req.query.id, {
            $set: {
                UserReturnReason: req.query.reason,
                Return: true
            }
        })
        res.status(200).json({ status: true })
    }

}

let buynow = async (req, res) => {
    try {
        let product = await Products.find({ _id: new ObjectId(req.query.prodId) })
        req.session.BUYNOW = true
        product[0].Quantity = 1
        product[0].Total = product[0].Price * product[0].Quantity
        req.session.Total = product[0].Total
        req.session.prodIds = req.query.prodId
        req.session.BuyProductDetails = product
        req.session.offer = product[0].Offer
        res.redirect('/Checkout?from=$2b$10$knH5tRojZMENZ0qftczcX.cGLPd6wfR3Hx31V881PHxX7Z2XVCxp2')
    } catch (e) {
        res.redirect('/ERROR')
        error(e)
    }
}

const invoice = async (req, res) => {
    try {
        if (req.query.from === '$2b$10$gviVtGpDfqpsAsCkbx8xaukeIQDirbAk2vIJ0IhJROGzYHeHUERp2') {
            let order = await Order.findById(req.query.orderId)
            let price = await detaisProducts(order, true)
            let Quantity = order.Quantity
            let products = order.ProdNames.map((item, index) => {
                return {
                    "quantity": Quantity[index],
                    "price": price[index],
                    "tax-rate": 6,
                    "description": item,
                }
            });

            var data = {
                "customize": {},
                "images": {
                    "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
                    "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
                },
                "sender": {
                    "company": "AV SHOPPS",
                    "address": "Av shopps Thrissur chiyyaram ",
                    "zip": "680026",
                    "city": "Thrissur",
                    "country": "INDIA"
                },
                "client": {
                    "company": order.FullName,
                    "address": order.userDetails.Address,
                    "zip": order.userDetails.Pincode,
                    "city": "Thrissur",
                    "phone": order.userDetails.Phone,
                    "country": "India"
                },
                "information": {
                    "number": order._id + "",
                    "date": order.OrderDate,
                    "due-date": "PAID"
                },
                "products": products,
                "bottom-notice": "Thank you for paying in AV SHOPPS",
                "settings": {
                    "currency": "INR",
                },
                "translate": {},
            };
            easyinvoice.createInvoice(data, function (result) {
                const base64Data = result.pdf;
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="INVOICE_' + Date.now() + '_.pdf"');
                const binaryData = Buffer.from(base64Data, 'base64');
                res.send(binaryData);
            });
        } else {
            res.redirect('/ERROR')
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating the PDF');
    }
}



async function detaisProducts(test, total) {
    return await Promise.all(test.prodId.map(async (item) => {
        if (total) {
            return (await Products.findById(item)).Price
        } else {
            return (await Products.findById(item)).Price
        }
    }))
}


const createInvoice = (data) => {
    return new Promise((resolve, reject) => {
        easyinvoice.createInvoice(data, (result) => {
            if (result.pdf) {
                resolve(result.pdf);
            } else {
                reject("Error creating the invoice PDF");
            }
        });
    });
};

async function pdfInvoice(orderId) {
    try {
        log(orderId)
        let order = await Order.findById(orderId);
        let user = await User.findById(order.userId);
        let price = await detaisProducts(order, true);
        let Quantity = order.Quantity;
        let products = order.ProdNames.map((item, index) => {
            return {
                "quantity": Quantity[index],
                "price": price[index],
                "tax-rate": 6,
                "description": item,
            }
        });

        const invoiceData = {
            "customize": {},
            "images": {
                "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
                "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
            },
            "sender": {
                "company": "AV SHOPPS",
                "address": "Av shopps Thrissur chiyyaram ",
                "zip": "680026",
                "city": "Thrissur",
                "country": "INDIA"
            },
            "client": {
                "company": order.FullName,
                "address": order.userDetails.Address,
                "zip": order.userDetails.Pincode,
                "city": "Thrissur",
                "phone": order.userDetails.Phone,
                "country": "India"
            },
            "information": {
                "number": order._id + "",
                "date": order.OrderDate,
                "due-date": "PAID"
            },
            "products": products,
            "bottom-notice": "Thank you for paying in AV SHOPPS",
            "settings": {
                "currency": "INR",
            },
            "translate": {},
        };

        const base64Data = await createInvoice(invoiceData);

        if (base64Data) {
            const binaryData = Buffer.from(base64Data, 'base64');
            const mailOptions = {
                from: 'alannixon2520@gmail.com',
                to: user.Email,
                subject: 'Invoice',
                text: 'Invoice For your order',
                attachments: [
                    {
                        filename: 'invoice' + Date.now() + '.pdf',
                        content: binaryData
                    }
                ]
            };
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'alannixon2520@gmail.com',
                    pass: process.env.OTPAPIKEY,
                },
            });

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('Error sending email: ' + error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        } else {
            console.log('Failed to create the invoice PDF');
        }
    } catch (e) {
        console.error(e);
        res.redirect('/ERROR')
    }
}



module.exports = {
    getOrders, orderCreate, getOrdersHistory, thanksForOrdering, FailedOrder, checkCoupon,
    cancelOrder, reqForCancel, getDate, buynow, invoice, decreaseStock
}
