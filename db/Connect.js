import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

export const connectDB = async()=>{
    try{
        await mongoose.set({'strictQuery': false})
        await mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true })
    } catch(e){
        console.error(e)
        return process.exit(1)
    }
}