import validator from 'express-validator'
import { Akun } from './db/Schema.js'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import path from 'path'
dotenv.config()

const { body, validationResult } = validator

class SubMiddleware{

    async getAccountByEmail(value){
        const matchEmail = await Akun.findOne({ email: value })
        if(!matchEmail) throw new Error(`Email not found!`)
        return true
    }

    async getAccountByPassword(value, { req }){
        const account = await Akun.findOne({ email: req.body.email })
        const matchPassword = await bcrypt.compare(value, account.password)
        if(!matchPassword) throw new Error(`Password not match!`)
        return true 
    }

}

const subMiddleware = new SubMiddleware()

class Middleware{
    constructor(){
        this.validator = this.validateLogin() }

    stillLogin(req, res, next){
        req.session.account && req.cookies['connect.sid'] ? res.status(400).redirect('/dashboard') : next() }

    isLogin(req, res, next){
        if( req.session.account && req.cookies['connect.sid'] ){
            req.account = req.session.account
            return next() }
        return res.status(400).redirect('/login') }

    validateLogin(){
        return [
        body('email').trim().isLength({ min: 1 }).withMessage(`Please fill the email field!`),
        body('email').trim().isEmail().withMessage(`Email not valid!`),
        body('email').trim().custom(subMiddleware.getAccountByEmail),
        body('password').trim().isLength({ min: 6 }).withMessage(`Minimum password include 6 chars!`),
        body('password').trim().custom(subMiddleware.getAccountByPassword) ]
    }

    getValidationError(req, res, next){
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            req.flash('param', errors.array()[0].param)
            req.flash('msg', errors.array()[0].msg)
            return res.status(400).redirect('/login') }
        return next()
    }

    isUser(req, res, next){
        req.account.role === "user" ? next() : res.status(400).redirect('/dashboard') }

    isAdmin(req, res, next){
        req.account.role === "admin" ? next() : res.status(400).redirect('/dashboard') }

    notUser(req, res, next){
        req.account.role !== "user" ? next() : res.status(400).redirect('/dashboard') }

    notPengurus(req, res, next){
        req.account.role !== "pengurus" ? next() : res.status(400).redirect('/dashboard') }

    fileValidator(req, res, next){
        const { name, size, md5, mv } = req.files.file
        const getExt = path.extname(name).toLowerCase()
        const fileName = md5 + getExt
        const urlFile = `${req.protocol}://${req.get("host")}/document/${fileName}`
        if(getExt !== '.pdf'){
            req.flash('error', 'file')
            req.flash('msg', `Format file tidak sesuai, silahkan coba lagi!`)
            return res.status(400).redirect('/createDocument')
        }
        if(size > 10000000){
            req.flash('error', 'file')
            req.flash('msg', `Ukuran file terlalu besar, silahkan coba lagi!`)
            return res.status(400).redirect('/createDocument')
        }
        mv(`./public/document/${fileName}`, async(err)=>{
            if(err){
                req.flash('error', 'file')
                req.flash('msg', err.message)
                return res.status(400).redirect('/createDocument')
            }
        })
        req.file = { name : fileName, url : urlFile }
        return next()
    }

}

export default new Middleware()