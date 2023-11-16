let randomstring = require('randomstring');
const { Coupens } = require('../../models/DbConnection');

function generateCode() {
    return randomstring.generate({
        length: 6,
        charset: 'numeric',
    });
}

function getDate(date, fullDay) {
    let currentDate = (!fullDay) ? new Date() : new Date(fullDay);
    currentDate.setDate(currentDate.getDate() + date);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

let getCoupenManagement = async (req, res) => {
    let coupens = await Coupens.find()
    console.log(coupens,coupens[0].Discount);
    res.render('admin/couponManagement', { coupens })
}

let createNewCoupen = async (req, res) => {
    let { coupenName, ExpiryDate, Discount } = req.body
    req.body.coupenName = coupenName.toUpperCase() + generateCode() + "AVSHOPS"
    req.body.ExpiryDate = getDate(Number(ExpiryDate), false)
    req.body.Discount = Number(Discount)
    req.body.Min = Number(req.body.Min)
    req.body.Max = Number(req.body.Max)
    let coup = await Coupens.findOne({ coupenName: coupenName })
    if (coup) {
        res.redirect('coupen-Management')
    } else {
        await Coupens.insertMany(req.body)
        res.redirect('coupen-Management')
    }
}

let deleteCoupen = async (req, res) => {
    if (await Coupens.findById(req.query.id)) { 
        await Coupens.findByIdAndDelete(req.query.id)
    }
    res.redirect('coupen-Management')

}

let IncDate = async (req, res) => {
    let { Inc, id, dateNow } = req.query
    await Coupens.findByIdAndUpdate(id, {
        $set: { ExpiryDate: getDate(Number(Inc), dateNow) }
    })
    res.redirect('coupen-Management')
}

let EditCoupen = async (req, res) => {
    try {
        let { id, Min, Discount } = req.body
        Min = Number(Min); Discount = Number(Discount.slice(0, -1))
        await Coupens.findByIdAndUpdate(id, {
            $set: {
                Min: Min,
                Discount: Discount
            }
        })
    } catch (err) {
        console.error(err);
    } finally {
        res.redirect('coupen-Management')
    }
}

module.exports = {
    getCoupenManagement, createNewCoupen, deleteCoupen, IncDate, EditCoupen
}