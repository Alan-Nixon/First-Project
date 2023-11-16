const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const orderController = require('./orderController')
const { Order, User } = require('../../models/DbConnection');
require('dotenv').config()


const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'alannixon2520@gmail.com',
    pass: process.env.OTPAPIKEY,
  },
});


function sendOtp(senderEmail) {

  function generateOTP() {
    return randomstring.generate({
      length: 6,
      charset: 'numeric',
    });
  }

  function sendOTP(email, otp) {
    const mailOptions = {
      from: 'alannixon2520@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  }

  const email = senderEmail;
  const otp = generateOTP();
  sendOTP(email, otp);
  console.log(otp);
  return otp
}

function contact(Data) {
  const mailOptions = {
    from: Data.Email,
    to: 'alannixon2520@gmail.com',
    subject: 'from contact',
    html: `<h1>Name : ${Data.Name}</h1>
    <p>Email: ${Data.Email}</p>
    <p>Message: ${Data.message}</p>
    <p>Phone Number: ${Data.Phone}</p>`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}


module.exports = { sendOtp,contact }

