// api for adding doctors
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import validator from "validator"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'
const addDoctor = async (req, res) => {
    try {
        const {name, email, password, speciality, degree, experience, about, fee, address} = req.body
        const imageFile = req.file // image uploaded through multer middleware

       // checking for all data to add doctor

       if(!name || !email || !password || !speciality || !degree || !experience || !about || !fee || !address){
        return res.json({
            success:false,
            message: "Missing Details"
        })
       }

       // we have all the data now we will validate the email format
       //using validator package
       if(!validator.isEmail(email)){
        return res.json({
            success:false,
            message: "Please Enter a valid Email"
        })
    }

        //validating strong password

        if(password.length < 8){
            return res.json({
            success:false,
            message: "Please Enter a strong password"
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

       res.json({success: true, message:"Doctor added"})
        
        

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

/// API to get all doctors list for admin panel

const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password') //remove the password property from the doctors response
        res.json({success:true, doctors})
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }

}

///API to get all appointments list

const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({
            success:true,
            appointments
        })
    } catch (error) {

        console.log(error)
        res.json({success:false, message:error.message})
        
    }
}

//API for cancel appointment

const appointmentCancel = async (req, res) => {
  try {
    const {  appointmentId } = req.body; //we will get the appointment from the users request body and we will provide the userID with authentication middleware

    const appointmentData = await appointmentModel.findById(appointmentId);

    // verify appointment user

    

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    }); // making the appointment cancelled and then the slot time will be available then making the changes in doctors lot_booked object

    //releasing the doctor slot

    const { docId, slotDate, slotTime } = appointmentData;

    const doctorData = await doctorModel.findById(docId);

    //extracting the slots_booked from this doctorData

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({
      success: true,
      message: "Appointment cancelled",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

 // API to get the dashboard data for admin panel

 const adminDashboard = async (req, res) => {
    try {
        //getting the total no of users and appointments and fetching 5 appointments

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0,5) //to get the altest appointment first
        }

        res.json({
            success:true,
            dashData
        })


    } catch (error) {
        
    }
 }

export {addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard}