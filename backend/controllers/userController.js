import validator from 'validator'
import {v2 as cloudinary} from 'cloudinary'


import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'


//API to register user

const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body

        if(!name || !password || !email){
            return res.json({success:false, message: "Missing Details"})
        }
        if(!validator.isEmail(email)) {
            return res.json({success:false, message: "Enter a valid Email"})
        }
        if(password.length < 8){
            return res.json({success:false, message:"Enter a Strong Password"})

        }

        //Adding the user in the database
        //first encrypting the password

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //saving the hashed password in the database
        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)

        const user = await newUser.save()
        //_id propeerty in user object by using this we will get a token

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)

        res.json({success:true, token})

    } catch (error) {
       console.log(error)
        res.json({success:false, message:error.message})
    }
}

//api for login user
const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({success:false, message:"User Doesn't exist"})
        }
        const isMatch = await bcrypt.compare(password, user.password)

        if(isMatch){
            const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)
             return res.json({success:true, token})
        }else{
            return res.json({success:false, message:"Invalid Credentials"})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

export {registerUser, loginUser}