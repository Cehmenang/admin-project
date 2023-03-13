import  { connectDB } from './db/Connect.js'
import fileUpload from 'express-fileupload'
import layouts from 'express-ejs-layouts'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import flash from 'connect-flash'
import Router from './Routes.js'
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()

class App {
    constructor(){
        this.app = express()
        this.secret = `bdaf57aa056ce0dbab3b9ad1c0389ad772d20267aa45e49ca0d5d35e79848a8f7b57c8f22763a9d939ffe5685c8548ad76996be45eb10da0b8f7694d6df786b0`
        this.middleware()
        this.connection()
    }
    middleware(){
        this.app.set('view engine', 'ejs')
        this.app.use(session({ secret: process.env.SECRET || this.secret, saveUninitialized: false, resave: false, cookie: {
            maxAge: 1000 * 60 * 120,
            secure: false,
            httpOnly: true
        } }))
        this.app.use(cors({ credentials: true, origin: '*' }))
        this.app.use(express.urlencoded({extended: true }))
        this.app.use(express.static('public'))
        this.app.use(express.json())
        this.app.use(fileUpload())
        this.app.use(cookieParser())
        this.app.use(flash())
        this.app.use(layouts)
        this.app.use(Router)
    }
    async connection(){
        await connectDB().then(()=>{
            this.app.listen(process.env.PORT, ()=>console.info(`Database & Server Connect Successfully at http://localhost:${process.env.PORT}`))
        })
    }
}

const app = new App().app