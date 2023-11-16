const Razorpay = require('razorpay');
require('dotenv').config()


var instance = new Razorpay({
    key_id: process.env.KEYID,
    key_secret: process.env.SECRETKEY,
});

let createOrder = function (Order) {
    return new Promise((resolve, reject) => {
        const options = {
            amount: Math.floor(Number(Order.TotalPrice)*100),  // amount in the smallest currency unit
            currency: "INR",
            receipt: Order.orderId,
        };
        try {
            instance.orders.create(options, function (err, order) {
                if (err) {
                    reject(err);
                } else {
                    resolve(order);
                }
            });
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}

module.exports = {
    createOrder
}
