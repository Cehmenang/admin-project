import validator from 'validator'
import mongoose from 'mongoose'

const Schema = mongoose.Schema

const akunSchema = new Schema({ 
    fullname: { 
        trim: true,
        type: String,
        required: [true, `Tolong masukkan nama lengkap!`],
        minlength: [3, `Nama minimal memuat 3 karakter!`] },
    email: { 
        trim: true,
        type: String,
        unique: true,
        required: [true, `Tolong masukkan email!`],
        validate: [validator.isEmail, `Email tidak valid!`] },
    password: { 
        trim: true, 
        type: String, 
        required: [true, `Tolong masukkan password!`], 
        minlength: [6, `Password minimal memuat 6 karakter!`] },
    company: { 
        trim: true, 
        type: String, 
        required: [true, `Tolong masukkan nama perusahaan!`], 
        minlength: [3, `Nama perusahaan minimal memuat 3 karakter!`] },
    phone: { 
        trim: true, 
        type: String, 
        unique: true,
        required: [true, `Tolong masukkan nomor handphone!`],
        validate: [ 
            { validator: isPhoneNumber, msg:`Nomor handphone tidak valid!` },
            { validator: isDuplicatePhone, msg:`Nomor handphone telah digunakan!` } ] },
    numOfDoc: {
        trim: true,
        type: Number },
    role: { 
        trim: true, 
        type: String, 
        required: true, 
        default: 'user' }
})

const account = mongoose.model('account', akunSchema)

function isPhoneNumber(value){ return validator.isMobilePhone(value, 'id-ID') }
async function isDuplicatePhone(value){
    const acc = await account.findOne({ phone: value })
    return !acc
}

const dokumenSchema = new Schema({
    title: {
        trim: true,
        type: String, 
        required: [true, `Please enter the title!`],
        minlength: [3, `Minimum title include 3 chars!`] },
    description : {
        trim: true,
        type: String },
    fileName : {
        trim: true,
        type: String,
        required: true },
    fileUrl : {
        trim: true,
        type: String,
        required: true },
    type: {
        trim: true,
        type: String,
        required: true },
    status: {
        trim: true,
        type: String,
        required: true,
        default: 'menunggu' },
    message: {
        trim: true,
        type: String,
        required: false,
    },
    senderId: { 
        trim: true,
        type: mongoose.ObjectId,
        ref: 'account',
        required: true },
    receiverId: {
        trim: true,
        type: mongoose.ObjectId,
        ref: 'account' }
}, { timestamps: { createdAt: true, updatedAt: false } } )

export const Akun = mongoose.model('account', akunSchema)
export const Dokumen = mongoose.model('document', dokumenSchema)
