import validator from 'validator'
import {v2 as cloudinary} from 'cloudinary'


import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'


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

//Get profile data api
const getProfile = async (req, res) => {
    try {
        //getting the userid using the authentication
        //user will send the token and by using that we will get the user id
        //now to change the header into the user id we will create a middleware authUser
        const { userId } = req.body
        const  userData = await userModel.findById(userId).select('-password')

        res.json({success:true, userData})

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})    }
}

///api to update user profile
const updateProfile = async (req, res) => {
    try {

        const{userId, name, phone, address, dob, gender} = req.body
        const imageFile = req.file

        if(!name || !phone || !address || !dob || !gender){
            return res.json({success:false, message:"Data Missing"})
        }

        await userModel.findByIdAndUpdate(userId, {name, phone, address:JSON.parse(address), dob, gender})
        if(imageFile){
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:'image'})
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, {image: imageURL})

        }

        res.json({success: true, message:"Profile Updated"})
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

///api to book the apppointment

const bookAppointment = async(req, res) => {
    try {

        const {userId, docId, slotDate, slotTime} = req.body
        //to get the doc id

        const docData= await doctorModel.findById(docId).select('-password')

        //if the doc is available or not for doc booking
        if(!docData.available){
            return res.json({
                success: false,
                message:'Doctor not available'
            })
        }

        //getting the slot booking data 

        let slots_booked = docData.slots_booked

        // checking for slots availability

        if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes(slotTime)){
                 return res.json({
                success: false,
                message:'slot not available'
            })}else{
                slots_booked[slotDate].push(slotTime)

            }
            

        } else{
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fee,
            slotTime,
            slotDate,
            date: Date.now()

            
        }

        //saving the appointment data in the database

        const newAppointment = new appointmentModel(appointmentData)

        await newAppointment.save()

        //save new slots data in doctors data

        await doctorModel.findByIdAndUpdate(docId, {slots_booked})

        res.json({success:true, message:'Appointment booked'})
        
    } catch (error) {

         console.log(error)
        res.json({success:false, message:error.message})
        
    }
}

//API to get user appointments for frontend my-appoitnments page

const listAppointment = async (req, res) => {

    try {
        

        const  {userId} = req.body
        const appointments = await appointmentModel.find({userId}) // finding the appointment with the userId

        res.json({
            success:true, appointments
        })
    } catch (error) {
         console.log(error)
        res.json({success:false, message:error.message})
        
    }
}
//API to cancel the appointment

const cancelAppointment = async (req, res) => {
    try {

        const {userId, appointmentId} = req.body //we will get the appointment from the users request body and we will provide the userID with authentication middleware

        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user

        if(appointmentData.userId !== userId) { //we will get the userID from the middleware and verify it
            return res.json({
                success:false,
                message: 'Unauthorized action'
            })



        }

        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true}) // making the appointment cancelled and then the slot time will be available then making the changes in doctors lot_booked object

        //releasing the doctor slot

        const {docId, slotDate, slotTime} = appointmentData

        const doctorData = await doctorModel.findById(docId)

        //extracting the slots_booked from this doctorData

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, {slots_booked})

        res.json({
            success:true,
            message: 'Appointment cancelled'
        })


        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}




export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment}
