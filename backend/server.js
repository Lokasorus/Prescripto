import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

//app config

const app = express()
const port = process.env.PORT || 4000 //port from env file or 4000
connectDB()
connectCloudinary()

//middlewares
app.use(express.json()) //it will act as middleware, whenever we make any request then the request will pas using this mehtod

app.use(cors()) //allow the frontend to connect with the backend

// api endpoints

app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)

// localhost:4000/api/admin

app.get('/', (req, res)=>{
    res.send('API WORKING ')
} )

//start the express app
app.listen(port, ()=> console.log("Server Started", port))


