import jwt from 'jsonwebtoken'

//doctor authentication middleware

const authDoctor = async (req, res, next) => {
    try {
        //if we have the token then only we can allow the user to make the api call otherwise we will terminate it

        const dToken = req.headers.dtoken || req.headers.dToken
        if(!dToken){
            return res.json({success:false, message:'Not Authorized login again'})
        }

        // to verify first we have to decode
        const token_decode = jwt.verify(dToken, process.env.JWT_SECRET)
        //decode token = emailid+password

        // Ensure req.body exists (for GET requests it might be undefined)
        if (!req.body) {
            req.body = {}
        }
        req.body.docId = token_decode.id

        next() // transferred control to next function i.e all-doctors or add doctors

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }

}

export default authDoctor