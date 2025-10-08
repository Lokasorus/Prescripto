import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken')?localStorage.getItem('aToken'):'')
    const backendUrl = import.meta.env.VITE_BACKEND_URL

     const[doctors, setDoctors] = useState([]) //for storing doctors list data getting from getAllDoctors api

    const getAllDoctors = async () => {
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/all-doctors', {}, {headers: {aToken}}) // we have to send the token in the headers for authentication and no body so empty object

            if(data.success){
                setDoctors(data.doctors)
                //console.log(data.doctors) // when clicked on DOctors List we will get the doctors data in the console
            }else{
                toast.error(data.message)
            }
            
        } catch (error) {
            toast.error(error.message)
        }
    }

    const changeAvailability = async (docId) => {
        try {
            
            const {data} = await axios.post(backendUrl + '/api/admin/change-availability', {docId}, {headers: {aToken}}) // we have to send the token in the headers for authentication and docId in body

            if(data.success){
                toast.success(data.message)
                getAllDoctors() // to refresh the doctors list after changing availability
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    const value = {
        aToken, setAToken, backendUrl, doctors, getAllDoctors, changeAvailability

    }

   
    return (
        <AdminContext.Provider value ={value}>
            {props.children}
        </AdminContext.Provider>  
    )
}

export default AdminContextProvider


