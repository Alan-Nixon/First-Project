const session = require('express-session')
const bcrypt = require('bcrypt')
const adminDb = require('./adminDb')
const fs = require('fs')
const CateController = require('./categoryController')
const { sendOtp } = require('../user/Otp')
const { log, error } = require('console')
const { Order, Products } = require('../../models/DbConnection')


let verifyLogin = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        next()
    } else {
        // next()
        res.redirect('login')
    }
}

function getDate(date, fullDay) {
    let currentDate = (!fullDay) ? new Date() : new Date(fullDay);
    currentDate.setDate(currentDate.getDate() + date);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function getRevenue(what, number) {
    if (what === "MONTH") {
        let notCurrentDate = getDate(number, false)
        let currentDate = getDate(0, false)
        let documents = await Order.find({
            OrderDate: {
                $gte: notCurrentDate,
                $lte: currentDate
            }
        })
        return documents.reduce((accumulator, item) => accumulator + item.TotalPrice, 0);
    }
}

async function getOrdersPerDay(what) {
    if (what === "PERDAY") {
        return await Order.find({
            OrderDate: {
                $eq: getDate(0, false)
            }
        })
    }
}


function whichDay(what) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const array = [];

    for (let i = 0; i < 7; i++) {
        let dayIndex = (what.getDay() + i) % 7;
        array.push(dayNames[dayIndex]);
    }

    console.log(array);
    return array;
}


async function getOrdersThisWeek(lastSunday) {
    try {
        log(lastSunday);
        let newArray = [lastSunday];
        for (let i = 1; i < 7; i++) {
            newArray.push(getDate(i, lastSunday));
        }
        let orders = null
        orders = newArray.map(async (item) => {
            return (Order.find({ OrderDate: item }));
        });
        orders = await Promise.all(orders);
        orders = orders.map((item) => { return item.length })
        return orders;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

let adminDashboard = async (req, res) => {
    if (req.session.adminLoggedIn) {
        let Revenue = await getRevenue("MONTH", -30)
        Revenue = (Revenue * 35) / 100
        let Orders = await getOrdersPerDay("PERDAY")
        let DailyEarning = Orders.reduce((accumulator, item) => accumulator + item.TotalPrice, 0);
        Orders = Orders.length
        let MonthlyEarning = await getRevenue("MONTH", -30)
        let YaxisGraph = await getOrdersThisWeek(getDate(-6, false))
        let XaxisGraph = whichDay(new Date(getDate(-6, false)))
        res.render('admin/dashboard', { Revenue, Orders, DailyEarning, MonthlyEarning, YaxisGraph, XaxisGraph })
    } else {
        res.redirect('admin/login')
    }
}


let getLogin = (req, res) => {
    if (req.session.adminLoggedIn) {
        res.redirect('/admin')
    } else {
        if (req.session.otpErr) {
            req.session.otpErr = false
            res.render('admin/Login', { otpErr: true })

        } else {
            res.render('admin/Login', { otpErr: false })

        }
    }
}

let postLogin = async (req, res) => {
    let adminDetails = await adminDb.adminDetails(req.body.Email)
    if (adminDetails && adminDetails.IsAdmin) {
        let Password = await bcrypt.compare(req.body.Password, adminDetails.Password)
        if (Password) {
            req.session.adminLoggedIn = true
            res.redirect('/admin')
        } else {

        }
    } else {
        res.redirect('/login')
    }
}


let logout = (req, res) => {
    req.session.destroy()
    res.redirect('login')
}


let getProductManagement = async (req, res) => {
    let sl = 1; let active1 = ''; let active2 = ''; let active3 = ''
    let products = await adminDb.getProduct();
    let categories = await adminDb.getCategorysOnly()
    categories = categories[0].Cate
    let currentPage = 0
    if (req.session.skipProduct) {
        sl = req.session.skipProduct + 1
        if (req.session.skipProduct === 5) { active2 = "active" }
        else if (req.session.skipProduct === 10) { active3 = "active" }
        else { active1 = "active" } currentPage = req.session.skipProduct
        products = await adminDb.getProductPage(req.session.skipProduct)
    }
    if (req.session.searchProducts) {
        products = req.session.searchProducts
        req.session.searchProducts = false
        res.render('admin/productManagement', { products, categories, currentPage, sl, active1, active2, active3 })
    } else {
        res.render('admin/productManagement', { products, categories, currentPage, sl, active1, active2, active3 })
    }
}


let deleteProduct = async (req, res) => {
    await adminDb.deleteProduct(req.query.prodId)
    res.redirect('product-Management')
}

let createProduct = async (req, res) => {
    await adminDb.insertProduct(req.body, false)
    res.redirect('product-Management')
}


let otpSend = async (req, res) => {
    let adminDetails = await adminDb.adminDetails(req.query.Email)
    if (adminDetails) {
        if (adminDetails.IsAdmin) {
            let Password = await bcrypt.compare(req.query.Password, adminDetails.Password)
            if (Password) {
                req.session.otp = sendOtp(req.query.Email)
                setTimeout(() => req.session.otp = false, 1000 * 60 * 3)
                res.status(200).json({})
            } else {
                res.status(402).json({ passwordErr: true })
            }
        } else {
            res.status(403).json({})
        }
    } else {
        res.status(405).json({ EmailErr: true })
    }
}

let verifyOtp = (req, res) => {
    if (req.body.otp === req.session.otp) {
        req.session.adminLoggedIn = true
        res.redirect('/admin')
    } else {
        req.session.otpErr = false
        res.redirect('login')
    }

}

let stockINC = async (req, res) => {
    try {
        let Inc = Number(req.query.Inc)
        let prodId = req.query.prodId
        if (isNaN(Inc)) {
            res.status(400)
        } else {
            let stock = await Products.findById(prodId);
            if (stock.Stock === 0 && Inc === -1) {
                res.status(401).json()
            } else {
                stock.Stock += Inc
                stock.save()
                res.status(200).json()
            }
        }
    } catch (e) {
        error(e)
        res.redirect('/ERROR')
    }
}


let productSearch = (req, res) => {
    console.log(req.body);
    let search = new RegExp('^' + req.body.search, 'i')
    console.log(search);
    adminDb.findSearchedProducts(search).then((response) => {
        req.session.searchProducts = response
        res.redirect('product-Management')
    })
}

let changeCoverImage = async (req, res) => {
    try {
        log(req.body.CoverImage, req.body.id)
        await Products.findByIdAndUpdate(req.body.id, {
            $set: {
                CoverImage: req.body.CoverImage
            }
        })
        res.redirect('product-Management')
    } catch (e) {
        error(e)
        res.redirect('/ERROR')
    }
}

let getProDetails = async (req, res) => {
    try {
        log(await Products.findById(req.query.prodId))
        res.status(200).json({ product: await Products.findById(req.query.prodId) })
    } catch (e) {
        res.redirect('/ERROR')
        console.log(e);
    }
}

module.exports = {
    adminDashboard, getLogin, postLogin, verifyLogin, logout, getProDetails,
    getProductManagement, deleteProduct, createProduct,
    otpSend, verifyOtp, stockINC, productSearch, changeCoverImage
}