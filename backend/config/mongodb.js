import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log("Database Connected"))
    //we will get to know when our mongodb gets connected
    await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`) // /prescripto creates a database in mongodb atlas whenever our connection establishes
    

}

export default connectDB