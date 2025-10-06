import jwt from 'jsonwebtoken'

//admin authentication middleware

const authAdmin = async (req, res, next) => {
    try {
        //if we have the token then only we can allow the user to make the api call otherwise we will terminate it

        const {atoken} = req.headers
        if(!atoken){
            return res.json({success:false, message:'Not Authorized login again'})
        }

        // to verify first we have to decode
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
        //decode token = emailid+password

        if(token_decode != process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD){
            return res.json({success:false, message:error.message})
        }

        next()
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }

}

export default authAdmin