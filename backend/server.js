import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'

//app config

const app = express()
const port = process.env.PORT || 4000 //port from env file or 4000
connectDB()
connectCloudinary()

//middlewares
app.use(express.json()) //it will act as middleware, whenever we make any request then the request will pas using this mehtod

app.use(cors()) //allow the frontend to connect with the backend

// api endpoints

app.get('/', (req, res)=>{
    res.send('API WORKING ')
} )

//start the express app
app.listen(port, ()=> console.log("Server Started", port))


