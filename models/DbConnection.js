const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
require('dotenv').config()

function isValidObjectId(str) { return /^[0-9a-fA-F]{24}$/.test(str); }


mongoose.connect(process.env.MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

const AddressSchema = new mongoose.Schema({
  Phone: String,
  HouseName: String,
  Pincode: String
})

const userSchema = new mongoose.Schema({
  FullName: String,
  Name: String,
  Email: String,
  Password: String,
  IsAdmin: Boolean,
  IsBlocked: String,
  Wallet: Number,
  Image: String,
  Address: AddressSchema
});

const productSchema = new mongoose.Schema({
  Name: String,
  Price: Number,
  Offer: Number,
  Description: String,
  Gen: String,
  Stock: Number,
  CoverImage: String,
  Brand: String,
  Genre: String,
  Specs: String,
  Images: [
    {
      type: String,
    },
  ],
  deleted: {
    type: Boolean,
    default: false
  }
})

let brandDetailsSchema = new mongoose.Schema({
  Name: String,
  Image: String,
  Category: String
})



let categorySchema = new mongoose.Schema({
  products: [{
    Cate: String,
    proName:String,
    prodId: ObjectId
  }]
})
 
const bannerSchema = new mongoose.Schema({
  bannerImage: String,
  Heading: String,
  Discount: String,
  Active: String,
  Description: String,
  Banner: Boolean
})

const coupenSchema = new mongoose.Schema({
  coupenName: String,
  ExpiryDate: String,
  Discount: Number,
  Min: Number,
  Max: Number
})

const cartSchema = new mongoose.Schema({
  userId: String,
  Products: [{
    prodId: ObjectId,
    Quantity: Number
  }]
})

const orderSchema = new mongoose.Schema({
  userId: String,
  prodId: [String],
  TotalPrice: Number,
  FullName: String,
  PaymentMethod: String,
  paymentStatus: String,
  Status: String,
  Discount: Number,
  DeliveryCharge: String,
  SubTotal: Number,
  FailedOrder: Boolean,
  OrderDate: String,
  ProdNames: [String],
  Quantity: [Number],
  Cancel: Boolean,
  Canceled: Boolean,
  AdminCancelReason: String,
  UserCancelReason: String,
  Return: Boolean,
  Returned: Boolean,
  UserReturnReason: String,
  userDetails: {
    CompanyName: String,
    Address: String,
    Phone: String,
    Appartment: String,
    state: String,
    Pincode: Number
  },
  Notes: String
})

const WishlistSchema = new mongoose.Schema({
  userId: String,
  Products: [ObjectId]
})



const User = mongoose.model('users', userSchema);
const Products = mongoose.model('products', productSchema)
const Category = mongoose.model('categorys', categorySchema)
const Banner = mongoose.model('banners', bannerSchema)
const Coupens = mongoose.model('coupens', coupenSchema)
const Cart = mongoose.model('cart', cartSchema)
const Order = mongoose.model('orders', orderSchema)
const Wishlist = mongoose.model('wishlist', WishlistSchema)


module.exports = { User, Products, Category, Banner, Cart, Coupens, Order, Wishlist, isValidObjectId }
