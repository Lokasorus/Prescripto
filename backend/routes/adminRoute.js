import express from 'express'
import { addDoctor, loginAdmin } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'

const adminRouter = express.Router()

// Test route to verify router works
adminRouter.get('/test', (req, res) => {
    res.json({success: true, message: 'Admin router is working!'})
})

// Add doctor endpoint with file upload
adminRouter.post('/add-doctor', upload.single('image'), addDoctor)
adminRouter.post('/login', loginAdmin)

export default adminRouter