const { User, Products, Banner, Category, Cart } = require('../../models/DbConnection')
const mongoose = require('mongoose')
let { log } = require('console')

let Id = async (userEmail) => { return await User.findOne({ Email: userEmail }, { _id: 1 }) }


let newUserInsert = async (userData) => {
    await User.insertMany(userData)
        .then((response) => { return response })
        .catch((err) => { return err })
}

let searchedProducts = async (search) => {
    search = '^' + search
    return Products.find({
        $or: [
            { Name: { $regex: search, $options: 'i' } },
            { Brand: { $regex: search, $options: 'i' } },
            { Genre: { $regex: search, $options: 'i' } }
        ]
    })
}




let IntelProducts = async cat =>  await Products.find(cat)



let divideArray = (arr, divide) => {
    const result = [];

    for (let i = 0; i < arr.length; i += divide) {
        result.push(arr.slice(i, i + divide));
    }

    return result;
}


let getCartProducts = async (userId) => {
    try {
        let cart = await Cart.findOne({ userId: userId });

        if (cart && cart.Products.length !== 0) {
            let proDetails = await Promise.all(cart.Products.map(async (item, index) => {
                try {
                    let product = await Products.findById(item.prodId);
                    if (product) {
                        product.Quantity = cart.Products[index]?.Quantity; 
                        product.Total = product.Price * cart.Products[index].Quantity;
                        product.CartId = cart._id.toString();
                        product.Offer = ((product.Offer * product.Price) / 100);
                        return product;
                    }
                } catch (error) {
                    console.error(`Error fetching product details for prodId: ${item.prodId}`, error);
                }
            }));

            proDetails = proDetails.filter(product => product !== undefined);
            return proDetails;
        } else {
            return [];
        }

    } catch (err) {
        console.error(err);
    }
};



let filterProducts = async (search) => {
    let product = await Products.find({
        $or: [
            { Name: { $regex: search, $options: 'i' } },
            { Brand: { $regex: search, $options: 'i' } },
            { Genre: { $regex: search, $options: 'i' } }
        ]
    }, { Price: 1, _id: 0 }).sort({ Price: 1 })
    let details = {
        diff: 0,
        lowestPrice: 0,
        highPrice: 0
    }
    if (product.length !== 0) {
        details = {
            diff: (product[product.length - 1].Price - product[0].Price) / 5,
            lowestPrice: product[0].Price,
            highPrice: product[product.length - 1].Price
        }
    }
    return details
}

let priceDiff = async (obj) => {
    let min = Math.floor(obj.lowestPrice + obj.diff)
    let arr = []
    for (let i = 0; i < 5; i++) {
        let sum = Math.floor(min + obj.diff)
        if (i > 0 && i < 4) {
            arr[i - 1] = min + '-' + sum
        }
        min += obj.diff
    }
    return arr
}


module.exports = {
    newUserInsert, filterProducts,searchedProducts, IntelProducts, divideArray,
     getCartProducts, priceDiff
}