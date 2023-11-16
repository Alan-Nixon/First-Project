const session = require('express-session');
const bcrypt = require('bcrypt');
const { google } = require('googleapis');
const multer = require('multer')
const { sendOtp } = require('./Otp');
const { log } = require('console')
const { Category, User, Products, Banner } = require('../../models/DbConnection');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLECLIENTID, process.env.GOOGLECLIENTSECRET);

const googleWindow = (req, res) => {
    console.log(req.query.from);
    req.session.GoogleFrom = req.query.from
    const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        redirect_uri: process.env.GOOGLEREDIRECTURL,
    });
    res.redirect(authUrl);
}

const googleCallback = async (req, res) => {
    const { code } = req.query;
    try {
        const tokenResponse = await client.getToken({
            code,
            redirect_uri: process.env.GOOGLEREDIRECTURL,
        });

        const tokens = tokenResponse.tokens;
        client.setCredentials(tokens);
        req.session.tokens = tokens;

        res.redirect('/success');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.redirect('/ERROR');
    }
}

const googleLoginSuccess = async (req, res) => {
    if (req.session.tokens) {
        try {
            client.setCredentials(req.session.tokens);
            const userInfo = await google.oauth2('v2').userinfo.get({ auth: client });
            log(userInfo.data)
            if (req.session.GoogleFrom === 'LOGIN') {
                let user = await User.findOne({ Email: userInfo.data.email })
                if (user) {
                    if (await bcrypt.compare(userInfo.data.id, user.Password)) {
                        req.session.userId = user._id
                        req.session.Email = user.Email
                        req.session.loggedIn = true
                        res.redirect("/login");
                    } else {
                        req.session.tryLogin = true
                        res.redirect('/login')
                    }
                } else {
                    req.session.pleaseSignup = true
                    res.redirect('/login')
                }

            } else if (req.session.GoogleFrom === 'SIGNUP') {
                let data = {
                    FullName: userInfo.data.name,
                    Name: userInfo.data.given_name,
                    Email: userInfo.data.email,
                    Password: await bcrypt.hash(userInfo.data.id, 10),
                    IsBlocked: "Active",
                    IsAdmin: false,
                    Image: userInfo.data.picture,
                    Wallet: 0
                }
                const user = await User.insertMany(data)
                log(user)
                req.session.userId = user[0]._id
                req.session.Email = user[0].Email
                req.session.loggedIn = true
                res.redirect("/");
            }

        } catch (error) {
            res.redirect('/ERROR');
        }
    } else {
        res.redirect('/ERROR');
    }
}


const Home = async (req, res) => {
    try {
        let products = await Products.find()
        let banner = await Banner.find({ Banner: true })
        let AboutUs = await Banner.findOne({ Banner: false })
        let logo = await Category.findOne({ Categories: { $exists: false } });
        const userExist = (req.session.loggedIn) ? true : false
        res.render('user/Home', { products, banner, AboutUs, logo, userExist })
    } catch (e) {
        res.redirect('/ERROR')
    }
};

let fetchLoginVerify = (req, res, next) => {
    if (req.session.loggedIn) {
        next()
    } else {
        res.status(208).json({})
    }
}

let loginVerify = (req, res, next) => {
    if (req.session.loggedIn) {
        next()
    } else {
        res.redirect('/login')
    }
}

let getLogin = (req, res) => {
    if (req.session.loggedIn) {
        res.redirect('/')
    } else {
        if (req.session.IsBlocked) {
            req.session.IsBlocked = false
            res.render('user/Login', { blocked: true, otpErr: false, Email: '', Password: '', tryLogin: false, pleaseSignup: false });
        } else if (req.session.otpError) {
            req.session.otpError = false

            res.render('user/Login', { blocked: false, otpErr: true, Email: req.session.Email, Password: req.session.req.session.Pass, tryLogin: false, pleaseSignup: false })
        } else {
            if (req.session.tryLogin) {
                req.session.tryLogin = false
                res.render('user/Login', { blocked: false, otpErr: false, Email: '', Password: '', tryLogin: true, pleaseSignup: false });
            } else if (req.session.pleaseSignup) {
                req.session.pleaseSignup = false
                res.render('user/Login', { blocked: false, otpErr: false, Email: '', Password: '', tryLogin: false, pleaseSignup: true });
            } else {
                res.render('user/Login', { blocked: false, otpErr: false, Email: '', Password: '', tryLogin: false, pleaseSignup: false });
            }
        }
    }
};

let postLogin = async (req, res) => {
    if (req.body.Email !== '' && req.body.Password !== '') {
        req.session.Email = req.body.Email
        req.session.Pass = req.body.Password
        let loginDetails = await User.findOne({ Email: req.body.Email });
        if (loginDetails) {
            if (loginDetails.IsBlocked === 'Active') {
                let passwordMatch = await bcrypt.compare(req.body.Password, loginDetails.Password);
                if (passwordMatch) {
                    req.session.otp = sendOtp(req.body.Email);
                    req.session.userId = loginDetails._id
                    req.session.Email = loginDetails.Email
                    res.status(200).json({ status: true });
                } else {
                    res.status(401).json({ status: false });
                }
            } else {
                res.status(403).json({ status: false });
            }
        } else {
            res.status(404).json({ status: false });
        }
    } else {
        res.status(400).json({ status: false })
    }
};


let loginOtpVerify = (req, res, next) => {
    if (req.body.otp === req.session.otp) {
        req.session.loggedIn = true
        res.redirect('/')
    } else {
        req.session.otpError = true
        res.redirect('/login')
    }
}

let signUp = (req, res) => {
    try {
        if (req.query?.referal) { req.session.referal = req.query.referal }
        if (req.session.otpError) {
            req.session.otpError = false
            console.log(req.session.signUpuserDetials);
            res.render('user/signUp', { userDetials: req.session.signUpuserDetials });
        } else {
            res.render('user/signUp', { userDetials: '' });
        }
    } catch (e) {
        console.error(e);
    }
};


let generateOtp = async (req, res, next) => {
    try {
        let loginDetails = await User.findOne({ Email: req.body.Email })
        console.log(req.body, loginDetails);
        if (req.body.fromPath === "signup") {
            if (loginDetails === null) {
                req.session.otp = sendOtp(req.body.Email);
                setTimeout(() => { console.log("Expired"); (req.session.otp = null) }, 1000 * 60 * 3);
                req.session.signUpuserDetials = req.body
                res.status(200).json({ status: true });
            } else {
                res.status(402).json({ status: false })
            }
        } else {
            next()
        }
    } catch (e) {
        res.redirect('/ERROR')
    }
};


let PostSignUp = async (req, res) => {
    console.log(req.body);
    if (req.body.otp === req.session.otp) {
        req.body.IsAdmin = false;
        req.body.IsBlocked = 'Active';
        let Password = await bcrypt.hash(req.body.Password, 10);
        req.body.Password = Password;
        req.body.Wallet = 0
        await User.insertMany(req.body);
        req.session.Email = req.body.Email
        req.session.loggedIn = true
        if (req.session?.referal) { sendBonus(req.session.referal) }
        res.redirect('/');
    } else {
        req.session.otpError = true
        res.redirect('/signup')
    }
};

let getProfile = async (req, res) => {
    let userDetials = await User.findOne({ Email: req.session.Email })
    try {
        if (userDetials) {
            if (userDetials?.Address === undefined) {
                userDetials.Address = {
                    Phone: '',
                    HouseName: '',
                    Pincode: ''
                }
            }
            if (userDetials?.Image === undefined) {
                userDetials.Image = "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp"
            }
            const referallink = `http://localhost:4000/signup?referal=${userDetials._id}`
            const userExist = (req.session.loggedIn) ? true : false
            res.render('user/profile', { userDetials, referallink, userExist })
        } else {
            res.redirect('/')
        }
    } catch (err) {
        console.error(err);
        res.redirect('/ERROR')
    }
}

let getForgetPassword = (req, res) => {
    if (req.session.notemailRegistered) {
        res.render('user/forget', { correctOtp: false, invalidOtp: false })
    } else {
        if (req.session.correctOtp) {
            req.session.correctOtp = false
            res.render('user/forget', { correctOtp: true, invalidOtp: false })
        } else if (req.session.ErrEnteredOtp) {
            req.session.ErrEnteredOtp = false
            res.render('user/forget', { correctOtp: false, invalidOtp: true })
        } else {
            res.render('user/forget', { correctOtp: false, invalidOtp: false })
        }
    }
}

let postForgetPassword = async (req, res) => {
    let doc = await User.findOne({ Email: req.session.Email })
    if (req.body.From === true) {
        if (doc) {
            req.session.otp = sendOtp(req.body.Email);
            setTimeout(() => { req.session.otp = null }, 1000 * 60 * 10);
            res.status(200).json({})
        } else {
            res.status(401).json({})
        }
    } else {
        if (req.body.Password !== undefined && req.body.otp !== undefined && req.body.From === 'false') {
            if (req.body.otp === req.session.otp) {
                let Password = await bcrypt.hash(req.body.Password, 10);
                console.log(req.session.userId);
                await User.findByIdAndUpdate(req.session.userId, {
                    $set: {
                        Password: Password
                    }
                })


            } else {
                req.session.ErrEnteredOtp = true
                res.redirect('/forgotPassword')
            }
        }
    }
}

let IsBlocked = async (req, res, next) => {
    try {
        let IsBlocked = await User.findOne({ Email: req.session.Email }, { IsBlocked: 1, _id: 0 })
        if (req.session?.Email === undefined) {
            next()
        } else {
            if (IsBlocked.IsBlocked === 'Active') {
                next()
            } else {
                req.session.IsBlocked = true
                req.session.loggedIn = false
                res.redirect('/login')
            }
        }
    } catch (e) {
        res.redirect('/ERROR')
    }
}


let updateDetials = async (req, res) => {
    try {
        let newDetials = req.body
        let Address = {
            Phone: newDetials.Phone,
            HouseName: newDetials.Address,
            Pincode: newDetials.Pincode
        }
        await User.findByIdAndUpdate(req.session.userId, {
            $set: {
                Name: newDetials.Name,
                FullName: newDetials.FullName,
                Address: Address
            }
        }, { upsert: true })
    } catch (e) {
        console.error(e);
    } finally {
        res.redirect('/profile')
    }
}

let logout = (req, res) => {
    req.session.destroy()
    res.redirect('/login')
}

let profileImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    } else {
        const imageBuffer = req.file.buffer;
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const dataUri = 'data:image/jpeg;base64,' + base64Image;
        await User.findByIdAndUpdate(req.session.userId, {
            $set: {
                Image: dataUri
            }
        }, { upsert: true })
        res.redirect('/profile')
    }
}

async function sendBonus(userId) {
    await User.findByIdAndUpdate(userId, {
        $inc: {
            Wallet: 1000
        }
    })
}

module.exports = {
    Home, getLogin, postLogin, signUp, PostSignUp, generateOtp, getProfile, loginVerify,
    getForgetPassword, postForgetPassword, loginOtpVerify, IsBlocked, updateDetials, logout,
    profileImage, fetchLoginVerify, googleWindow, googleCallback, googleLoginSuccess
};
