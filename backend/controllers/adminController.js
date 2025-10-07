// api for adding doctors
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import validator from "validator"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const addDoctor = async (req, res) => {
    try {
        const {name, email, password, speciality, degree, experience, about, fee, address} = req.body
        const imageFile = req.file // image uploaded through multer middleware

       // checking for all data to add doctor

       if(!name || !email || !password || !speciality || !degree || !experience || !about || !fee || !address){
        return res.json({
            success:false,
            messsage: "Missing Details"
        })
       }

       // we have all the data now we will validate the email format
       //using validator package
       if(!validator.isEmail(email)){
        return res.json({
            success:false,
            messsage: "Please Enter a valid Email"
        })
    }

        //validating strong password

        if(password.length < 8){
            return res.json({
            success:false,
            messsage: "Please Enter a strong password"
        })
     }

     ////encryptin password
     const salt = await bcrypt.genSalt(10)
     const  hashedPassword = await bcrypt.hash(password, salt)

     //upload image to cloudinary
     const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"})
     const imageUrl = imageUpload.secure_url

     const doctorData = {
        name,
        email,
        image:imageUrl,
        password: hashedPassword,
        speciality,
        degree,
        experience,
        about,
        fee,
        address:JSON.parse(address), //we have address as an object but in formData we have to convert it into string
        date: Date.now()
     }

       const newDoctor = new doctorModel(doctorData)
       await newDoctor.save() // data will be saved to database

       res.json({sucess: true, message:"Doctor added"})
        
        

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

//API for the admin login
const loginAdmin = async (req,res) => {
    try {
        const {email, password} = req.body
        
        // Debug logs
        // console.log('Received email:', email)
        // console.log('Received password:', password)
        // console.log('Expected email:', process.env.ADMIN_EMAIL)
        // console.log('Expected password:', process.env.ADMIN_PASSWORD)
        
        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password, process.env.JWT_SECRET )
            res.json({success:true, token})
        }else{
            res.json({success: false, message:"Invalid Credentials"})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

export {addDoctor, loginAdmin}