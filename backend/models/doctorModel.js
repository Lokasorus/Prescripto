import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: {type:String, required:true}, //have to procide doctor name
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    image: {type:String, required:true},
    speciality: {type:String, required:true},  // ✅ Fixed: specality → speciality
    degree: {type:String, required:true},
    experience: {type:String, required:true},
    about: {type:String, required:true},
    available: {type:Boolean, default:true},   // ✅ Fixed: required → default (optional field)
    fee: {type:Number, required:true},
    address: {type:Object, required:true},
    date: {type:Number, required:true},
    slots_booked: {type:Object, default:{}}
},{minimize:false})

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema)

// whenever our project gets started this statement will get executed and it could get executed multiple times so to prevent that we check for available doctor models

export default doctorModel