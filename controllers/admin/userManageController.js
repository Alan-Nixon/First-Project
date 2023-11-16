const session = require('express-session')
const bcrypt = require('bcrypt')
const adminDb = require('./adminDb')
const fs = require('fs')
const { sendOtp } = require('../user/Otp')
const { User, isValidObjectId } = require('../../models/DbConnection')
const { log } = require('console')


let getuserManagment = async (req, res, next) => {
    let users; let skipUser = 0; let active1 = ''; let active2 = ''; let active3 = ''
    if (req.session.skipUser) {
        skipUser = req.session.skipUser
        if (skipUser === 0) { active1 = 'active' } else if (skipUser === 10) { active2 = 'active' }
        else if (skipUser === 20) { active3 = 'active' }
        users = await User.find({ IsAdmin: { $ne: true } }).skip(skipUser).limit(10)
    } else if (req.session.search) {
        req.session.search = false
        users = req.session.searchedUsers
    } else {
        active1 = 'active'
        users = await adminDb.userDetials(false)
    }
    res.render('admin/userManagment', { users, skipUser, active1, active2, active3 })

}

let blockUser = (req, res) => {
    try { 
        if(isValidObjectId(req.query.id)) { 
            let status = (req.query.status === 'Active') ? 'blocked' : 'Active'
            adminDb.blockUser(req.query.id, status)
            req.session.blockUser = true
            res.redirect('/admin/user-Managment')
        } else{
            res.redirect('/ERROR')
        }
    } catch (e) { 
        res.redirect('/ERROR')
    }
    
}


let searchUser = async (req, res) => {
    req.session.searchedUsers = await adminDb.searchUser(req.body.search)
    req.session.search = true
    res.redirect('user-Managment')
}


let deleteUser = (req, res) => {
    adminDb.userDelete(req.query.id)
    res.redirect('/admin/user-Managment')
}

let nextUserPage = (req, res) => {
    console.log(req.query);
    if (req.query?.minus) {
        let count = (req.query.minus==='true')?-10:10
        req.session.skipUser = Number(req.query.now) + count
    } else {
        req.session.skipUser = (Number(req.query.pageNo) * 10) - 10
    }
    res.redirect('user-Managment')
}

module.exports = {
    getuserManagment, blockUser, searchUser, deleteUser, nextUserPage
}