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
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server started on port ${port}`));

connectDB()
connectCloudinary()

//middlewares
app.use(express.json()) //it will act as middleware, whenever we make any request then the request will pas using this mehtod

// CORS configuration - temporarily allow all origins for debugging
app.use(cors({
    origin: true, // Allow all origins temporarily
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'aToken', 'dToken']
})) //allow the frontend to connect with the backend

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


