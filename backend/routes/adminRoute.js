import express from 'express'
import { addDoctor, allDoctors, loginAdmin } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/auth.admin.js'
import { changeAvailability } from '../controllers/doctorController.js'

const adminRouter = express.Router()

// Test route to verify router works
adminRouter.get('/test', (req, res) => {
    res.json({success: true, message: 'Admin router is working!'})
})

// Add doctor endpoint with file upload
adminRouter.post('/add-doctor',authAdmin, upload.single('image'), addDoctor) //using the authadmin middleware to verify token
adminRouter.post('/login', loginAdmin)
adminRouter.post('/all-doctors', authAdmin, allDoctors)
adminRouter.post('/change-availability', authAdmin, changeAvailability)



export default adminRouter