import Pagination from './Pagination.js'
import Middleware from './Middleware.js'
import Service from './Service.js'
import express from 'express'

class Routes {
    constructor(){
        this.router = express.Router()
        this.paginationRoutes()
        this.serviceRoutes() }

    paginationRoutes(){
        this.router.get('/register', Middleware.stillLogin, Pagination.registerPage)
        this.router.get('/login', Middleware.stillLogin, Pagination.loginPage)
        this.router.get('/dashboard', Middleware.isLogin, Pagination.dashboardPage)
        this.router.get('/createDocument', Middleware.isLogin, Pagination.createDocPage) 
        this.router.get('/documentList', Middleware.isLogin, Middleware.isAdmin, Pagination.docListPage)
        this.router.get('/viewDocument', Middleware.isLogin, Pagination.viewDocPage)
        this.router.get('/inbox', Middleware.isLogin, Middleware.notPengurus, Pagination.inboxPage)
        this.router.get('/pengurusList', Middleware.isLogin, Middleware.isAdmin, Pagination.pengurusListPage)
        this.router.get('/createPengurus', Middleware.isLogin, Middleware.isAdmin, Pagination.createPengurusPage)
        this.router.get('/sendDocument', Middleware.isLogin, Middleware.isAdmin, Pagination.sendDocPage)
        this.router.get('/sendTo', Middleware.isLogin, Middleware.isAdmin, Service.sendHandler)
        this.router.get('/acceptDocument', Middleware.isLogin, Service.acceptDocumentHandler)
        this.router.get('/cancelDocument', Middleware.isLogin, Pagination.cancelDocPage)
        this.router.get('/userList', Middleware.isLogin, Middleware.isAdmin, Pagination.userListPage)
        this.router.get('/history', Middleware.isLogin, Pagination.historyPage)
        this.router.get('*', Middleware.stillLogin, Pagination.handlePage)
    }
    serviceRoutes(){
        this.router.post('/register', Service.registerHandler)
        this.router.post('/login', Middleware.validator, Middleware.getValidationError, Service.loginHandler)
        this.router.post('/logout', Service.logoutHandler)
        this.router.post('/createDocument', Middleware.isLogin, Middleware.fileValidator, Service.createDocumentHandler)
        this.router.post('/cancelDocument', Middleware.isLogin, Service.cancelDocumentHandler)
        this.router.post('/createPengurus', Middleware.isLogin, Middleware.isAdmin, Service.createPengurusHandler)
    }

}

export default new Routes().router