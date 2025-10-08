import { createContext, useState } from "react";
import axios from 'axios';
import { useEffect } from "react";
import { toast } from "react-toastify";



export const AppContext = createContext()

// eslint-disable-next-line react-refresh/only-export-components
const AppContextProvider = (props) => {

    const currencySymbol = '$'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const[doctors, setDoctors] = useState([]) //for storing doctors list data getting from getDoctors api
    const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'')// if token is there in local storage then set it otherwise empty string to remove create account on refreshing the page

    //state variable to store the userData
    const [userData, setUserData] = useState(false)

    const getDoctorsData = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/doctor/list')
            
            if(data.success){
                setDoctors(data.doctors)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const loadUserProfileData = async () => {
        try {
            console.log('🔍 Loading user profile data...')
            console.log('🔍 Token:', token)
            console.log('🔍 Backend URL:', backendUrl)

            const {data} = await axios.get(backendUrl + '/api/user/get-profile', {headers: {token}})
            console.log('📡 Profile API Response:', data)
            
            if(data.success){
                console.log('✅ User data loaded:', data.userData)
                setUserData(data.userData)
            }else{
                console.log('❌ Profile API failed:', data.message)
                toast.error(data.message)
            }
            
        } catch (error) {
            console.error('🚨 Profile API Error:', error)
            toast.error(error.message)
        }

    }

    const value = {
        //whatever we add here can be accessed in any component
        doctors, currencySymbol, getDoctorsData, token, setToken, backendUrl, userData, setUserData, loadUserProfileData
    }

    useEffect(()=>{
        getDoctorsData()
    },[])

    useEffect(()=> {
        if(token){
            loadUserProfileData()
        }else{
            //when we logged out then token will be removed and hence userData should also be removed
            setUserData(false)
        }
    },[token])


    return (
        <AppContext.Provider value ={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider