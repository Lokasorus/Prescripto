import axios from "axios";

import { createContext, useState } from "react";
import { toast } from "react-toastify";

const DoctorContext = createContext()

const DoctorContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')

    const [appointments, setAppointments] = useState([])

    const [dashData, setDashData] = useState(false) // to store the dashboard data like total patients, total appointments, total earnings

    const [profileData, setProfileData] = useState(false)

    const getAppointments = async () => {

        try {
            // Check if backendUrl is defined
            if (!backendUrl) {
                toast.error('Backend URL is not configured')
                return
            }

            const {data} = await axios.get(backendUrl + '/api/doctor/appointments', {headers: {dToken}})
            if(data.success){
                setAppointments(data.appointments) // to show the latest appointment first
                console.log(data.appointments)
                console.log(data.appointments)
            }else {
                toast.error(data.message)
            }
            
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const completeAppointment = async (appointmentId) => {

        try {
            const {data} = await axios.post(backendUrl + '/api/doctor/complete-appointment', {appointmentId}, {headers: {dToken}})
            if(data.success){
                toast.success(data.message)
                getAppointments()
            }else{
                toast.error(data.message)
            }
            
        } catch (error) {
             console.log(error)
            toast.error(error.message)
            
        }
    }
    const cancelAppointment = async (appointmentId) => {

        try {
            const {data} = await axios.post(backendUrl + '/api/doctor/cancel-appointment', {appointmentId}, {headers: {dToken}})
            if(data.success){
                toast.success(data.message)
                getAppointments()
            }else{
                toast.error(data.message)
            }
            
        } catch (error) {
             console.log(error)
            toast.error(error.message)
            
        }
    }

    const getDashData = async () => {
        try {

            const {data} = await axios.get(backendUrl + '/api/doctor/dashboard', {headers: {dToken}})
            if(data.success){
                setDashData(data.dashData)
                


            }else{
                toast.error(data.message)
            }
            
            
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getProfileData = async () => {
        try {
            console.log('=== GET PROFILE DEBUG ===')
            console.log('backendUrl:', backendUrl)
            console.log('dToken:', dToken)
            console.log('Request URL:', backendUrl + '/api/doctor/profile')

            const {data} = await axios.get(backendUrl + '/api/doctor/profile', {headers: {dToken}})
            
            console.log('Full response:', data)
            console.log('Success:', data.success)
            console.log('Profile Data:', data.profileData)

            if(data.success){
                setProfileData(data.profileData)
                console.log('✅ Profile data set successfully:', data.profileData)
                
            }else{
                console.log('❌ Backend returned success: false')
                toast.error(data.message)
            }
            
        } catch (error) {
            console.log('❌ Error occurred:', error)
            console.log('Error response:', error.response?.data)
            toast.error(error.message)
        }
    }

    



    const value = {

        dToken, setDToken, backendUrl, appointments, getAppointments, completeAppointment, cancelAppointment, dashData, setDashData, getDashData, profileData, setProfileData, getProfileData

    }

    return (
        <DoctorContext.Provider value ={value}>
            {props.children}
        </DoctorContext.Provider>  
    )
}

export { DoctorContext };
export default DoctorContextProvider;