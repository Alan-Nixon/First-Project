const { log, error } = require('console')
const { Products } = require('../../models/DbConnection')



let pageNumber = (req, res) => {
    if (req.query?.currentPage) {
        req.session.skipProduct = Number(req.query?.currentPage) + Number(req.query.inc)
        if (req.query.from === 'OFFER') { res.redirect('offer-Management') }
        else { res.redirect('product-Management') }
    } else {
        req.session.skipProduct = (Number(req.query?.no) * 5) - 5
        if (req.query.from === 'OFFER') { res.redirect('offer-Management') }
        else { res.redirect('product-Management') }
    }
}


const deleteOtherImage = async (req, res) => {
    console.log("is this calling jsdgjksdwdklsdlu7e 6xf8u");
    try {
        let pro = await Products.findById(req.query.prodId)
        const queryIndex = req.query.index + "";

        pro.Images.splice(queryIndex, 1);
        log(queryIndex, pro, pro.Images)

        pro.save()
        res.status(200).json()
    } catch (e) {
        error(e)
        res.status(400).json()
    }
}


let updateProductImages = async (req, res) => {
    log(req.files)
    let array = req.files
    let Images = array.map((item) => { return item.filename })
    await Products.findByIdAndUpdate(req.body.id, {
        $addToSet: {
            Images: { $each: Images }
        }
    });

    res.redirect('product-Management')
}

const updateProduct = async (req, res) => {
    try {
        const updateFields = {
            Name: req.body.Name,
            Price: req.body.Price,
            Stock: req.body.Stock,
            Description: req.body.Description
        };

        if (req.body.Gen !== "0000000000") {updateFields.Gen = req.body.Gen;}
        await Products.findByIdAndUpdate(req.body.prodId, { $set: updateFields });
        res.redirect('product-Management');
        
    } catch (e) {
        error(e)
        res.redirect('/ERROR')
    }
}


module.exports = {
    pageNumber, deleteOtherImage, updateProductImages, updateProduct
}