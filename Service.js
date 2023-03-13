import { Akun, Dokumen } from './db/Schema.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
dotenv.config()

class SubService {

    async preSave(account){
        try{
            account.fullname = account.fullname.toLowerCase()
            const salt = await bcrypt.genSalt(10)
            account.password = await bcrypt.hash(account.password, salt)
            return account
        }catch(err){ return console.error(err)}
    }

    filePreSave(req, res, file, { name, url }, { id, role }, penerima ){
        file.fileName = name
        file.fileUrl = url
        file.senderId = id
        if(role === "pengurus"){
            if(penerima === "none"){
                req.flash('error', 'penerima')
                req.flash('msg', `Dimohon menentukan pengirim yang dituju!`)
                return res.status(400).redirect('/createDocument')
            }
            file.receiverId = penerima
            file.status = 'terkirim'
            file.type = 'keluar'
        } else file.type = 'masuk'
        return file
    }

    errorHandler(e, req, res){
        let errs = []
        const errors = e.errors || null
        if(errors && errors.fullname) errs.push({ params: 'fullname', msg: errors.fullname.properties.message }) 
        if(errors && errors.email) errs.push({ params: 'email', msg: errors.email.properties.message }) 
        if(errors && errors.password) errs.push({ params: 'password', msg: errors.password.properties.message }) 
        if(errors && errors.company) errs.push({ params: 'company', msg: errors.company.properties.message }) 
        if(errors && errors.phone) errs.push({ params: 'phone', msg: errors.phone.properties.message }) 
        if(e.code && e.code == 11000) errs.push({ params: 'email', msg: `Email is already used!` }) 
        req.flash( errs[0].params, errs[0].msg ) 
        return res.status(400).redirect('/register')
    }
    
    generateSession(req, { _id, fullname, email, phone, role }, remember){
        const account = { id : _id, fullname, email, phone, role }
        req.session.account = account
        return req.session.account
    }

    async numOfDocHandler(id, res){
        try{
            const pengurus = await Akun.findOne({ _id: id })
            const numOfDoc = pengurus.numOfDoc - 1
            await Akun.updateOne({ _id: id }, { numOfDoc })
            return res.status(200).redirect('/dashboard') 
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

}

const subService = new SubService()

class Service{

    async registerHandler(req, res){
        try{
            const account = new Akun(req.body)
            const acc = await subService.preSave(account)
            await acc.save()
            return res.status(200).redirect('/login')
        }catch(err){ return subService.errorHandler(err, req, res) }
    }

    async loginHandler(req, res){
        try{
            const remember = req.body.remember || null
            const account = await Akun.findOne({ email: req.body.email })
            subService.generateSession(req, account, remember)
            return res.status(200).redirect('/dashboard')
        }catch(e){ return res.status(400).json({ err: e.message }) }
    }

    logoutHandler(req, res){
        req.session.destroy(err=>{
            if(err) return res.status(400).json({msg:err.message})
            res.clearCookie('connect.sid')
            return res.status(200).redirect('/login')
        })
    }

    async createDocumentHandler(req, res){
        try{
            let file = new Dokumen(req.body)
            file = subService.filePreSave(req, res, file, req.file, req.account, req.body.penerima || "none")
            await file.save()
            return res.status(200).redirect('/dashboard')
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async acceptDocumentHandler(req, res){
        try{
            if(!req.query.id) req.account.role === "pengurus" ? res.status(400).redirect('/dashboard') : res.status(400).redirect('/inbox')
            const dokumen = await Dokumen.findOne({ _id: req.query.id })
            if(!dokumen) req.account.role === "pengurus" ? res.status(400).redirect('/dashboard') : res.status(400).redirect('/inbox')
            await Dokumen.updateOne({ _id: req.query.id }, { status: 'diterima' })
            req.account.role === "pengurus" ? subService.numOfDocHandler(req.account.id, res) : res.status(200).redirect('/inbox')
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async cancelDocumentHandler(req, res){
        try{
            const dokumen = await Dokumen.findOne({ _id: req.body.id })
            if(!dokumen) req.account.role === "pengurus" ? res.status(400).redirect('/dashboard') : res.status(400).redirect('/inbox')
            if(req.account.role == "pengurus"){
                await Dokumen.updateOne({ _id: req.body.id }, { status: 'ditolak', message: req.body.message })
                subService.numOfDocHandler(req.account.id, res) }
            req.account.role == "admin" ? await Dokumen.updateOne({ _id: req.body.id }, { status: 'ditolak', message: req.body.message, receiverId: req.account.id }) : await Dokumen.updateOne({ _id: req.body.id }, { status: 'ditolak', message: req.body.message })
            res.status(200).redirect('/inbox')
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async createPengurusHandler(req, res){
        try{
            const account = new Akun(req.body)
            account.role = "pengurus"
            const acc = await subService.preSave(account)
            await acc.save()
            return res.status(200).redirect('/pengurusList')
        }catch(err){ return subService.errorHandler(err, req, res) }
    }

    async sendHandler(req, res){
        try{
            if(!req.query.dokumen && !req.query.pengurus) return res.status(400).redirect('/inbox')
            const dokumen = await Dokumen.findOne({ _id: req.query.dokumen })
            const pengurus = await Akun.findOne({ _id: req.query.pengurus })
            if(!dokumen || !pengurus) return res.status(400).redirect('/inbox')
            !pengurus.numOfDoc ? pengurus.numOfDoc = 1 : pengurus.numOfDoc += 1
            await Dokumen.updateOne({ _id: req.query.dokumen }, { receiverId: req.query.pengurus, status: 'terkirim' })
            await Akun.updateOne({ _id: req.query.pengurus }, { numOfDoc: pengurus.numOfDoc })
            return res.status(200).redirect('/documentList')
        }catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async settingHandler(req, res){
        try{
            console.log(req.body.logout)
            if(req.body.logout) console.log(req.body.logout)
            const account = await Akun.findOne({ _id: req.account.id })
            let hashPassword = null
            if(req.body.password && req.body.password.length < 6){
                req.flash('param', 'password')
                req.flash('msg', 'Minimum password include 6 chars!')
                return res.status(400).redirect('/setting')
            }
            if(req.body.password !== "******" && req.body.password){
                const genSalt = await bcrypt.genSalt(10)
                hashPassword = await bcrypt.hash(req.body.password, genSalt)
            }
            await Akun.updateOne({ _id: req.account.id }, { 
                fullname: !req.body.fullname ? account.fullname : req.body.fullname, 
                password: req.body.password == "******" || !req.body.password ? account.password : hashPassword ,
                phone: !req.body.phone ? account.phone : req.body.phone
            })
            req.session.account.fullname = !req.body.fullname ? account.fullname : req.body.fullname
            req.session.account.phone =  !req.body.phone ? account.phone : req.body.phone
            return res.status(200).redirect('/setting')
        }catch(e){ return res.status(400).json({ err: e.message }) }
    }


}

export default new Service()