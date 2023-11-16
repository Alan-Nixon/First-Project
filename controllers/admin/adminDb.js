const { User, Products, Category, Banner } = require('../../models/DbConnection')

let adminDetails = async (adminEmail) => {
  try {
    return await User.findOne({ Email: adminEmail, IsAdmin: true })
  } catch (error) {
    console.error('Error in adminDetails:', error.message);
    throw error;
  }
}

let userDetials = async (admin) => {
  try {
    if (admin === 2520) {
      return await User.findOne({ IsAdmin: true })
    } else {
      return (admin) ? await User.find() : await User.find({ IsAdmin: { $ne: true } }).limit(10)
    }
  } catch (error) {
    console.error('Error in userDetials:', error.message);
    throw error;
  }
}


let productId = async (Id) => {
  try {
    return await Products.findById(Id);
  } catch (error) {
    console.error('Error in productId:', error.message);
    throw error;
  }
}

let blockUser = async (userId, status) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        IsBlocked: status
      }
    });
  } catch (error) {
    console.error('Error in blockUser:', error.message);
    throw error;
  }
}

let userDelete = async (userId) => {
  try {
    await User.findByIdAndDelete(userId);
  } catch (error) {
    console.error('Error in userDelete:', error.message);
    throw error;
  }
}

let searchUser = async (search) => {
  try {
    search = '^' + search;
    return await User.find({
      $and: [
        {
          $or: [
            { Name: { $regex: search, $options: 'i' } },
            { Email: { $regex: search, $options: 'i' } }
          ]
        },
        { IsAdmin: false }
      ]
    });
  } catch (error) {
    console.error('Error in searchUser:', error.message);
    throw error;
  }
}

let getProduct = async () => {
  try {
    return await Products.find({ deleted: false }).sort({ Genre: -1, Name: 1 }).limit(5);
  } catch (error) {
    console.error('Error in getProduct:', error.message);
    throw error;
  }
}

let getProductPage = async (skip) => {
  try {
    return await Products.find({ deleted: false }).sort({ Genre: -1, Name: 1 }).skip(skip).limit(10);
  } catch (error) {
    console.error('Error in getProduct:', error.message);
    throw error;
  }
}



let deleteProduct = async (Id) => {
  try {
    await Products.findByIdAndUpdate(Id, {
      $set: {
        deleted: true
      }
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error.message);
    throw error;
  }
}

let insertProduct = async (Data) => {
  try {
    Data.Offer = 0
    await Products.insertMany(Data);
  } catch (error) {
    console.error('Error in insertProduct:', error.message);
    throw error;
  }
}





////======================//// DELETE ///================////

let ImageUpsert = async (id, Images, Data) => {
  try {
    let product = await Products.findById(id);
    if (!product) {
      return
    } else {

    }

    let { Name, Price, Gen, Stock, Description } = Data;

    await Products.findByIdAndUpdate(id, {
      $set: {
        Name: Name,
        Price: Price,
        Gen: Gen,
        Stock: Stock,
        Description: Description
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
};

let brandDelete = async (category, Brand) => {
  try {
    await Category.findOneAndUpdate({ Categories: category }, {
      $pull: { Brands: Brand }
    });
  } catch (error) {
    console.error('Error in brandDelete:', error.message);
    throw error;
  }
}

let changeBrands = async (category, oldbrand, newbrand) => {
  try {
    let doc = await Category.findOne({ Categories: category });
    if (!doc) {
      return;
    }
    if (doc.Brands.includes(newbrand)) {
      return;
    } else {
      await Category.findByIdAndUpdate(
        doc._id,
        {
          $set: { 'Brands.$[oldbrand]': newbrand }
        },
        {
          arrayFilters: [{ 'oldbrand': oldbrand }]
        }
      );
    }
  } catch (error) {
    console.error('Error in changeBrands:', error.message);
    throw error;
  }
}

let addBrand = async (category, Brand) => {
  try {
    let doc = await Category.findOne({ Categories: category })
    if (doc.Brands.includes(Brand)) {
      return;
    } else {
      await Category.findByIdAndUpdate(doc._id, {
        $push: { Brands: Brand }
      });
    }
  } catch (error) {
    console.error('Error in addBrand:', error.message);
    throw error;
  }
}
let deleteCategory = async (category) => {
  try {
    await Category.findOneAndDelete({ Categories: category });
  } catch (error) {
    console.error('Error in deleteCategory:', error.message);
    throw error;
  }
}

let addCategory = async (category, brands) => {
  try {
    await Category.insertMany({ Categories: category, Brands: [brands] });
  } catch (error) {
    console.error('Error in addCategory:', error.message);
    throw error;
  }
}

let getCategorysOnly = async () => {
  try {
    return await Category.aggregate([
      {
        $group: {
          _id: null, // This means we're grouping all documents into a single group
          Cate: {
            $addToSet: "$Categories" // Use $addToSet to collect unique Categories values
          }
        }
      }, { $sort: { "Cate": -1 } }
    ]);
  } catch (error) {
    console.error('Error in getCategorysOnly:', error.message);
    throw error;
  }
}

let deleteAllProduct = async (category, Brand) => {
  try {
    let products = await Products.find({ Genre: category })
    products.map(async (item) => {
      if (item.Brand === Brand) {
        await Products.deleteOne({ Brand: Brand })
      }
    })
  } catch (err) {
    console.error(err);
  }
}
let findSearchedProducts = async (search) => {
  return Products.find({
    $and: [
      {
        $or: [{ Name: search }, { Brand: search }, { Genre: search }]
      },
      { deleted: false }
    ]
  });
}



let getBanner = async () => {
  return await Banner.find({ Banner: true })
}

let updateBanner = async (detials) => {
  await Banner.findByIdAndUpdate(detials.id, {
    $set: {
      Heading: detials.Heading,
      Discount: detials.Discount,
      Description: detials.Description
    }
  })
}

let getAboutUs = async () => {
  return await Banner.findOne({ Banner: false })
}

let insertInCategory = async (Data) => {
  console.log(Data);
  if (await Category.findOne({ id: Data.id })) {
    if (Data.FromPath === true) {
      await Category.findOneAndUpdate({ id: Data.id }, {
        $set: {
          TopBrands: true
        }
      })
    } else {
      await Category.findOneAndUpdate({ id: Data.id }, {
        $set: {
          NewProduct: true
        }
      })
    }

  } else {
    await Category.insertMany(Data)
  }
}

let CheckIfTop = async (data) => {
  let product = await Category.findOne({ id: data })
  if (product) {
    if (product.TopBrands && product.NewProduct) {
      console.log("two same");
      return "TOPNEW"
    } else if (product.TopBrands && !product.NewProduct) {
      console.log("top only");
      return "TOPBRANDS"
    } else if (product.NewProduct && !product.TopBrands) {
      console.log("NEW only");
      return "NEWPRODUCT"
    }
  } else {
    return "NOTFOUND"
  }

}

module.exports = {
  adminDetails, userDetials, blockUser, userDelete, searchUser,  ImageUpsert, changeBrands, addCategory, getAboutUs,
  getProduct, deleteProduct, productId, insertProduct, brandDelete, addBrand, deleteCategory, insertInCategory,
  getCategorysOnly, deleteAllProduct, findSearchedProducts, getBanner, updateBanner, CheckIfTop,
  getProductPage
}