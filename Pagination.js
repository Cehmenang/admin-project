import { Akun, Dokumen } from "./db/Schema.js"

const errorRegister = (req)=>{
    return {
        fullname : { param: 'fullname', msg: req.flash('fullname') },
        email : { param: 'email', msg: req.flash('email') },
        password: { param: 'password', msg: req.flash('password') },
        company : { param: 'company', msg: req.flash('company') },
        phone: { param: 'phone', msg: req.flash('phone') } }
}

const adminDashboardHandler = async( account, res)=>{
    try{
        let inboxSurat = await Dokumen.find({ status: 'menunggu', type: 'masuk' })
        inboxSurat = inboxSurat.length

        let suratMasuk = await Dokumen.find({ status: 'terkirim', type: 'masuk' })
        suratMasuk = suratMasuk.length

        let suratKeluar = await Dokumen.find({ status: 'terkirim', type: 'keluar' })
        suratKeluar = suratKeluar.length

        let totalSurat = await Dokumen.find({ status: { $ne: 'menunggu' } })
        totalSurat = totalSurat.length
        
        return res.status(200).render('dashboard/admin', { layout: 'layout/main', title: 'Dashboard Admin', style: 'dashboard/admin', account, inboxSurat, suratMasuk, suratKeluar, totalSurat })
    } catch(e){ return res.status(400).json({ err: e.message }) }
}

const userDashboardHandler = async( account, res)=>{
    try{
        const dokumen = await Dokumen.find({ senderId: account.id, status: 'menunggu' })
        return res.status(200).render('dashboard/user', { layout: 'layout/main', title: 'Dashboard User', style: 'dashboard/user', account, dokumen })
    } catch(e){ return res.status(400).json({ err: e.message }) }
}

const pengurusDashboardHandler = async( account, res)=>{
    try{
        const dokumen = await Dokumen.find({ receiverId: account.id, status: 'terkirim' }).populate({ path: 'senderId', select: ['fullname', 'company'] })
        return res.status(200).render('dashboard/pengurus', { layout: 'layout/main', title: 'Dashboard Pengurus', style: 'dashboard/pengurus', account, dokumen })
    } catch(e){ return res.status(400).json({ err: e.message }) }
}

const adminInboxHandler = async(search, sort, res)=>{
    try{
        let dokumen
        if(search !== "none"){
            const searchKey = new RegExp(`.*${search}.*`)
            dokumen = await Dokumen.find({
                $or : [ 
                    { title: { $regex: searchKey, $options: 'i' } },
                    { description: { $regex: searchKey, $options: 'i' } } ],
                status: 'menunggu' }).populate({ path: 'senderId', select: ['fullname', 'company'] }) 
        } else { 
            sort !== "none" && sort == "terlama" ? dokumen = await Dokumen.find({ status: 'menunggu' }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] })  : dokumen = await Dokumen.find({ status: 'menunggu' }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }) 
        }
        return res.status(200).render('inbox/admin', { layout: 'layout/main', title: 'Inbox Page', style: 'inbox/admin', dokumen } )
    } catch(e){ return res.status(400).json({ err: e.message }) }
}

const userInboxHandler = async(search, sort, account, res)=>{
    try{
        let dokumen
        if(search !== "none"){
            const searchKey = new RegExp(`.*${search}.*`)
            dokumen = await Dokumen.find({
                $or : [ 
                    { title: { $regex: searchKey, $options: 'i' } },
                    { description: { $regex: searchKey, $options: 'i' } } ],
                status: 'terkirim', type: 'keluar', receiverId: account.id }).populate({ path: 'senderId', select: ['fullname', 'company'] }) 
        } else { 
            sort !== "none" && sort == "terlama" ? dokumen = await Dokumen.find({ status: 'terkirim', type: 'keluar', receiverId: account.id }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] })  : dokumen = await Dokumen.find({ status: 'terkirim', type: 'keluar', receiverId: account.id }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }) 
        }
        return res.status(200).render('inbox/user', { layout: 'layout/main', title: 'Inbox Page', style: 'inbox/user', dokumen } )
    } catch(e){ return res.status(400).json({ err: e.message }) }
}

const adminHistoryHandler = async(req, res)=>{
    try{
        let dokumen
        if(req.query.search && ( !req.query.sort && !req.query.type )){
            const searchKey = new RegExp(`.*${req.query.search}.*`)
            dokumen = await Dokumen.find({
                $or : [ 
                    { title: { $regex: searchKey, $options: 'i' } },
                    { description: { $regex: searchKey, $options: 'i' } },
                    { status: 'diterima' }, { status: 'ditolak' } ] 
                }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })
        }

        // if(!req.query.search && (!req.query.sort && req.query.type == "masuk")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'masuk' }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })
        
        // if(!req.query.search && (req.query.sort == "terlama" && req.query.type == "masuk")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'masuk' }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

        // if(!req.query.search && (!req.query.sort && req.query.type == "keluar")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'keluar' }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })
        
        // if(!req.query.search && (req.query.sort == "terlama" && req.query.type == "keluar")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'keluar' }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

        // if(!req.query.search && (req.query.sort == "terlama" && !req.query.type)) dokumen = await Dokumen.find({ status: 'terkirim' }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

        if(!req.query.search && (!req.query.sort && !req.query.type)) dokumen = await Dokumen.find({ $or:[ 
            { status: 'diterima' }, { status: 'ditolak' } ]  })
            .sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

        return res.status(200).render('history/admin', { layout: 'layout/main', title: 'History Page', style: 'history/admin', dokumen })
    } catch(e){ return res.status(400).json({ err: e.message }) }
}

const userViewDocHandler = ( dokumen, res )=>{
    return res.status(200).render('viewDoc/user', { layout: 'layout/main', title: 'View Document', style: 'viewDoc/user', dokumen })
}

const adminViewDocHandler = ( dokumen, res )=>{
    return res.status(200).render('viewDoc/admin', { layout: 'layout/main', title: 'View Document', style: 'viewDoc/admin', dokumen })
}

class Pagination {

    registerPage(req, res){
        const error = errorRegister(req)
        return res.status(200).render('register', { layout: 'layout/main', title: 'Register Page', style: 'register', error })
    }

    loginPage(req, res){
        const error = { param : req.flash('param'), msg : req.flash('msg') } || null 
        return res.status(200).render('login', { layout: 'layout/main' ,title: 'Login Page', style: 'login', error })
    }

    dashboardPage(req, res){
        if(req.account.role == "pengurus") return pengurusDashboardHandler(req.account, res)
        if(req.account.role == "admin") return adminDashboardHandler(req.account, res)
        return userDashboardHandler(req.account, res)
    }

    async createDocPage(req, res){
        try{
            if(req.account.role == "admin") return res.status(400).redirect('/dashboard')
            let users = []
            if(req.account.role == "pengurus") users = await Akun.find({ role: 'user' })
            const error = { param: req.flash('error'), msg: req.flash('msg') } || null
            return res.status(200).render('createDoc', { layout: 'layout/main', title: 'Create Document', style: 'createDoc', error, users, role: req.account.role })
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async viewDocPage(req, res){
        try{ 
            if(!req.query.id) return res.status(400).redirect('/dashboard')
            const dokumen = await Dokumen.findOne({ _id: req.query.id })
            if(!dokumen) return res.status(400).redirect('/dashboard')
            if(req.account.role == "admin") return adminViewDocHandler(dokumen, res)
            return userViewDocHandler(dokumen, res)
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async docListPage(req, res){
        try{
            let dokumen

            if(req.query.search && ( !req.query.sort && !req.query.type )){
                const searchKey = new RegExp(`.*${req.query.search}.*`)
                dokumen = await Dokumen.find({
                    $or : [ 
                        { title: { $regex: searchKey, $options: 'i' } },
                        { description: { $regex: searchKey, $options: 'i' } } ],
                    status: 'terkirim' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })
            }

            if(!req.query.search && (!req.query.sort && req.query.type == "masuk")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'masuk' }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })
            
            if(!req.query.search && (req.query.sort == "terlama" && req.query.type == "masuk")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'masuk' }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

            if(!req.query.search && (!req.query.sort && req.query.type == "keluar")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'keluar' }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })
            
            if(!req.query.search && (req.query.sort == "terlama" && req.query.type == "keluar")) dokumen = await Dokumen.find({ status: 'terkirim', type: 'keluar' }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

            if(!req.query.search && (req.query.sort == "terlama" && !req.query.type)) dokumen = await Dokumen.find({ status: 'terkirim' }).sort({ createdAt: 'asc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

            if(!req.query.search && (!req.query.sort && !req.query.type)) dokumen = await Dokumen.find({ status: 'terkirim' }).sort({ createdAt: 'desc' }).populate({ path: 'senderId', select: ['fullname', 'company'] }).populate({ path: 'receiverId', select: ['fullname'] })

            return res.status(200).render('docList/admin', { layout: 'layout/main', title: 'Document List', style: 'docList/admin', dokumen, account: req.account } )
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    inboxPage(req, res){
        req.account.role === "admin" ? adminInboxHandler(req.query.search || "none", req.query.sort || "none", res) : userInboxHandler(req.query.search || "none", req.query.sort || "none", req.account, res)
    }

    async sendDocPage(req,res){
        try{
            if(!req.query.id) return res.status(400).redirect('/inbox')
            const dokumen = await Dokumen.findOne({ _id : req.query.id })  
            if(!dokumen) return res.status(400).redirect('/inbox')
            const pengurus = await Akun.find({ role : 'pengurus' })
            return res.status(200).render( 'sendDoc/admin', { layout: 'layout/main', title: 'Send Document', style: 'sendDoc/admin', id : dokumen._id, pengurus } )
        } catch(e){ return res.status(400).json({ err: e.message }) }
        
    }

    async cancelDocPage(req, res){
        try{
            if(!req.query.id) req.account.role === "admin" ? res.status(400).redirect('/inbox') : res.status(400).redirect('/dashboard')
            const dokumen = await Dokumen.findOne({ _id: req.query.id })
            if(!dokumen) req.account.role === "admin" ? res.status(400).redirect('/inbox') : res.status(400).redirect('/dashboard')
            return res.status(200).render( 'cancelDoc', { layout: 'layout/main', title: 'Cancel Document', style: 'cancelDoc', id : dokumen._id })
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async pengurusListPage(req, res){
        try{
            const pengurus = await Akun.find({ role : 'pengurus' })
            return res.status(200).render( 'pengurusList', { layout: 'layout/main', title: 'Pengurus List', style: 'pengurusList', pengurus } )
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    async userListPage(req, res){
        try{
            const users = await Akun.find({ role: 'user' })
            return res.status(200).render( 'userList', { layout: 'layout/main', title: 'User List', style: 'userList', users } )
        } catch(e){ return res.status(400).json({ err: e.message }) }
    }

    createPengurusPage(req, res){
        const error = errorRegister(req)
        return res.status(200).render('createPengurus', { layout: 'layout/main', title: 'Create Pengurus', style: 'createPengurus', error })
    }

    historyPage(req,res){
        if(req.account.role === "admin") return adminHistoryHandler(req, res)
        if(req.account.role === "pengurus") return pengurusHistoryHandler(res)
        return userHistoryHandler(res)
    }

    handlePage(req, res){
        return res.status(200).redirect('/login')
    }

}

export default new Pagination()