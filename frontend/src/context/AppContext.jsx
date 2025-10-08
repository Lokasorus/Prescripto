import { createContext, useState } from "react";
import axios from 'axios';
import { useEffect } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '$'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const[doctors, setDoctors] = useState([]) //for storing doctors list data getting from getDoctors api



    const getDoctorsData = async () => {
        try {
            console.log('🔍 Making API call to:', backendUrl + '/api/doctor/list')
            const {data} = await axios.get(backendUrl + '/api/doctor/list')
            console.log('📡 API Response:', data)
            
            if(data.success){
                console.log('✅ Doctors data received:', data.doctors)
                setDoctors(data.doctors)
            }else{
                console.log('❌ API returned success: false, message:', data.message)
                toast.error(data.message)
            }
        } catch (error) {
            console.error('🚨 API Error:', error)
            console.log('Backend URL:', backendUrl)
            toast.error(error.message)
        }
    }

    const value = {
        //whatever we add here can be accessed in any component
        doctors, currencySymbol, getDoctorsData
    }

    useEffect(()=>{
        getDoctorsData()
    },[])
    return (
        <AppContext.Provider value ={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider